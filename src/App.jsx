import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, setDoc, deleteDoc, onSnapshot, query, where, Timestamp, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';

import { THEMES } from './theme';
import { getTimeBasedMeal, calculateGoalCals, getLocalDateStr } from './utils';

import { useFoodLogs } from './hooks/useFoodLogs';
import { useActivities } from './hooks/useActivities';
import { useTodayBurned } from './hooks/useTodayBurned';

// --- Lazy loaded Pages & Components ---
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const DiaryView = lazy(() => import('./components/DiaryView'));
const UserProfileView = lazy(() => import('./components/UserProfileView'));
const AddFoodView = lazy(() => import('./components/AddFoodView'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const WorkoutTrackingPage = lazy(() => import('./pages/WorkoutTrackingPage'));
const WorkoutSessionDetailPage = lazy(() => import('./pages/WorkoutSessionDetailPage'));
const Navigation = lazy(() => import('./components/Navigation'));
const ConfirmModal = lazy(() => import('./components/ConfirmModal'));
const EditDayModal = lazy(() => import('./components/Dashboard/EditDayModal'));
const FoodDetailModal = lazy(() => import('./components/Dashboard/FoodItem').then(m => ({ default: m.FoodDetailModal })));
const DailyDetailModal = lazy(() => import('./components/Dashboard/DailyDetailModal'));
const DailyStatsPage = lazy(() => import('./pages/DailyStatsPage'));

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold">App Crashed</h2>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-blue-600 rounded-full font-bold">Reload App</button>
                <pre className="mt-8 p-4 bg-gray-900 rounded text-[10px] text-left w-full overflow-auto text-red-300 opacity-50">
                    {this.state.error?.toString()}
                </pre>
            </div>
        );
        return this.props.children;
    }
}

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[#121212] text-white">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <span className="text-sm font-medium opacity-50 uppercase tracking-widest">Loading Calorie Tracker...</span>
    </div>
);

// ==========================================
// 3. MAIN APP CONTAINER
// ==========================================

export default function App() {
    return (
        <ErrorBoundary>
            <MainApp />
        </ErrorBoundary>
    );
}

function MainApp() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [currentView, setCurrentView] = useState('home');
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- CUSTOM HOOKS (Encapsulated Logic) ---
    const { 
        logs, totals, waterIntake, 
        addFoodItem, deleteFoodItem, deleteBatch: deleteBatchFood, 
        updateWater, updateDayTotals, updateWeight
    } = useFoodLogs(user, currentDate);
    
    const { addActivity, deleteActivity } = useActivities(user, currentDate);
    const burnMetrics = useTodayBurned(currentDate);
    const { totalBurned } = burnMetrics;

    const [userStats, setUserStats] = useState({
        weight: 70, height: 170, age: 25, activity: 'moderate',
        goalCals: 2000, targetWeight: null, targetDays: null,
        needsOnboarding: false
    });

    const styles = THEMES[theme] || THEMES.dark;

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeAddMeal, setActiveAddMeal] = useState('Snacks');
    const [addType, setAddType] = useState('food');
    const [editingFood, setEditingFood] = useState(null);
    const [editingDay, setEditingDay] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [showConfirm, setShowConfirm] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [selectionState, setSelectionState] = useState({ meal: null, selectedIds: new Set() });
    const [showDayDetail, setShowDayDetail] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthLoading(false);
            if (!u) {
                setUserStats({ needsOnboarding: false });
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.className = theme;
    }, [theme]);

    // Auto-reset currentDate at midnight so food logs go to the correct day
    useEffect(() => {
        const checkDateChange = () => {
            const now = new Date();
            if (now.toDateString() !== currentDate.toDateString() && 
                // Only auto-reset if user was viewing "today" (not browsing history)
                new Date(Date.now() - 86400000).toDateString() === currentDate.toDateString()) {
                setCurrentDate(new Date());
            }
        };
        const interval = setInterval(checkDateChange, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [currentDate]);

    useEffect(() => {
        if (!user) return;
        const userDoc = doc(db, 'users', user.uid);
        const unsub = onSnapshot(userDoc, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setUserStats(prev => ({ ...prev, ...data }));
                
                // Initialization for existing users
                if (data.weight && (!data.startDate || !data.initialWeight)) {
                    const runInitialization = async () => {
                        const updates = {};
                        if (!data.startDate) updates.startDate = new Date().toISOString();
                        if (!data.initialWeight) updates.initialWeight = data.weight;
                        
                        if (Object.keys(updates).length > 0) {
                            await setDoc(userDoc, updates, { merge: true });
                        }
                    };
                    runInitialization();
                }
            } else {
                setUserStats(prev => ({ ...prev, needsOnboarding: true }));
            }
        });
        return unsub;
    }, [user]);

    const handleOnboarding = async (data) => {
        if (!user) return;
        try {
            const now = new Date().toISOString();
            const finalStats = { 
                ...data, 
                needsOnboarding: false,
                startDate: now,
                initialWeight: data.weight
            };
            finalStats.goalCals = calculateGoalCals(finalStats);
            await setDoc(doc(db, 'users', user.uid), finalStats, { merge: true });
            setUserStats(finalStats);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenAddModal = (meal = null, type = 'food') => {
        setAddType(type);
        setActiveAddMeal(meal || getTimeBasedMeal());
        setIsAddModalOpen(true);
    };

    const handleAddFood = async (item, mealType) => {
        if (!user) return;
        try {
            if (mealType === 'exercise') {
                await addActivity(item);
            } else {
                await addFoodItem(item, mealType, editingFood);
            }
            setEditingFood(null);
            setIsAddModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Save failed: " + e.message);
        }
    };

    const deleteFood = async (food) => {
        await deleteFoodItem(food);
        setSelectedFood(null);
    };

    const toggleSelectionMode = (meal) => {
        if (selectionState.meal === meal) setSelectionState({ meal: null, selectedIds: new Set() });
        else setSelectionState({ meal, selectedIds: new Set() });
    };

    const toggleItemSelection = (food) => {
        const newSelected = new Set(selectionState.selectedIds);
        if (newSelected.has(food.uid)) newSelected.delete(food.uid);
        else newSelected.add(food.uid);
        setSelectionState({ ...selectionState, selectedIds: newSelected });
    };

    const deleteBatch = async (meal) => {
        await deleteBatchFood(meal, selectionState.selectedIds);
        setSelectionState({ meal: null, selectedIds: new Set() });
    };

    if (authLoading) return <LoadingScreen />;
    if (!user) return <Suspense fallback={<LoadingScreen />}><AuthPage theme={theme} onLogin={(u) => setUser(u)} /></Suspense>;

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-24 ${styles.bg}`}>
            {userStats.needsOnboarding && (
                <Suspense fallback={null}>
                    <OnboardingModal theme={theme} onComplete={handleOnboarding} user={user} />
                </Suspense>
            )}

            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
                {currentView === 'home' && (
                    <DashboardPage
                        logs={logs}
                        userStats={userStats}
                        totals={totals}
                        goal={userStats.goalCals || 2000}
                        waterIntake={waterIntake}
                        theme={theme}
                        toggleTheme={() => {
                            const list = Object.keys(THEMES);
                            const idx = list.indexOf(theme);
                            setTheme(list[(idx + 1) % list.length]);
                        }}
                        updateWater={updateWater}
                        totalBurned={totalBurned}
                        burnMetrics={burnMetrics}
                        onAddClick={handleOpenAddModal}
                        onAddExercise={() => handleOpenAddModal(null, 'exercise')}
                        onEditFood={(f) => { 
                            setEditingFood(f); 
                            handleOpenAddModal(f.meal, 'food');
                        }}
                        onDeleteFood={(f) => setShowConfirm({ title: "Delete Entry?", message: `Remove ${f.name}?`, onConfirm: () => deleteFood(f) })}
                        onFoodClick={setSelectedFood}
                        onDeleteBatch={deleteBatch}
                        selectionState={selectionState}
                        toggleSelectionMode={toggleSelectionMode}
                        toggleItemSelection={toggleItemSelection}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        onDeleteExercise={deleteActivity}
                        onRingClick={() => setCurrentView('stats')}
                    />
                )}
            </Suspense>

            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
                {currentView === 'stats' && (
                    <DailyStatsPage 
                        totals={totals}
                        goal={userStats.goalCals || 2000}
                        waterIntake={waterIntake}
                        burnMetrics={burnMetrics}
                        theme={theme}
                        userStats={userStats}
                        onBack={() => setCurrentView('home')}
                    />
                )}
            </Suspense>

            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-purple-500" /></div>}>
                {currentView === 'diary' && (
                    <DiaryView
                        theme={theme} user={user}
                        toggleTheme={() => {
                            const list = Object.keys(THEMES);
                            const idx = list.indexOf(theme);
                            setTheme(list[(idx + 1) % list.length]);
                        }}
                        onDayClick={(day) => { setEditingDay(day); }}
                    />
                )}
            </Suspense>

            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
                {currentView === 'profile' && (
                    <UserProfileView 
                        user={user} theme={theme} userStats={userStats} 
                        onLogout={() => signOut(auth)} 
                        onUpdateStats={async (data) => {
                            const updated = { ...userStats, ...data };
                            updated.goalCals = calculateGoalCals(updated);
                            await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
                        }}
                        onThemeChange={setTheme}
                        onLogWeight={updateWeight}
                    />
                )}
            </Suspense>

            <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-red-500" /></div>}>
                {(currentView === 'workout' || currentView === 'tracking' || currentView === 'session-detail') && (
                    <WorkoutRouter 
                        view={currentView} 
                        setView={setCurrentView} 
                        theme={theme} 
                        activeSessionId={activeSessionId}
                        setActiveSessionId={setActiveSessionId}
                    />
                )}
            </Suspense>

            <Suspense fallback={null}>
                <Navigation 
                    currentView={currentView} 
                    onViewChange={setCurrentView} 
                    onAddClick={() => handleOpenAddModal()}
                    theme={theme}
                />
            </Suspense>

            <Suspense fallback={null}>
                {isAddModalOpen && (
                    <AddFoodView
                        type={addType}
                        user={user}
                        userStats={userStats}
                        onClose={() => { setIsAddModalOpen(false); setEditingFood(null); }}
                        onAdd={handleAddFood}
                        theme={theme}
                        editingFood={editingFood}
                        meal={activeAddMeal}
                    />
                )}
            </Suspense>

            <Suspense fallback={null}>
                {showDayDetail && (
                    <DailyDetailModal
                        isOpen={true}
                        onClose={() => setShowDayDetail(false)}
                        totals={totals}
                        goal={userStats.goalCals}
                        water={waterIntake * 250}
                        burned={totalBurned}
                        theme={theme}
                    />
                )}
                
                {selectedFood && (
                    <FoodDetailModal 
                        food={selectedFood} 
                        theme={theme} 
                        onClose={() => setSelectedFood(null)} 
                        onEdit={(f) => { 
                            setEditingFood(f); 
                            handleOpenAddModal(f.meal, 'food');
                        }}
                        onDelete={(f) => setShowConfirm({ title: "Delete Entry?", message: `Remove ${f.name}?`, onConfirm: () => deleteFood(f) })}
                    />
                )}
            </Suspense>

            <Suspense fallback={null}>
                {showConfirm && (
                    <ConfirmModal 
                        isOpen={true}
                        title={showConfirm.title} 
                        message={showConfirm.message} 
                        onConfirm={() => { showConfirm.onConfirm(); setShowConfirm(null); }} 
                        onCancel={() => setShowConfirm(null)} 
                        theme={theme} 
                    />
                )}
            </Suspense>

            <Suspense fallback={null}>
                {editingDay && (
                    <EditDayModal 
                        dayData={editingDay} 
                        theme={theme} 
                        onClose={() => setEditingDay(null)} 
                        onSave={updateDayTotals} 
                    />
                )}
            </Suspense>
        </div>
    );
}

function WorkoutRouter({ view, setView, theme, activeSessionId, setActiveSessionId }) {
    if (view === 'workout') return <WorkoutPage onStartTracking={() => setView('tracking')} theme={theme} onSessionClick={(id) => { setActiveSessionId(id); setView('session-detail'); }} />;
    if (view === 'tracking') return <WorkoutTrackingPage onFinish={() => setView('workout')} theme={theme} />;
    if (view === 'session-detail') return <WorkoutSessionDetailPage sessionId={activeSessionId} onBack={() => setView('workout')} theme={theme} />;
    return null;
}
