
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, Minus, Activity, TrendingDown, Sparkles, Home, BookOpen,
    BarChart2, User, Sun, Moon, TreeDeciduous, CheckSquare, Square,
    Flame, X, Edit2, Trash2, Mic, ArrowRight, Search, ScanLine,
    AlertCircle, Loader2, ChevronRight, Utensils, Footprints
} from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, setDoc, Timestamp, serverTimestamp, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
console.log("ManualLogSheet-v2.1: Firestore functions imported:", { addDoc: !!addDoc, setDoc: !!setDoc });
console.log("Calorify-App-v2.1: Firestore functions imported:", { doc: !!doc, setDoc: !!setDoc, deleteDoc: !!deleteDoc });
import { THEMES, GRAPH_COLORS, iOSBlurLight, iOSBlurDark, iOSBlurWooden } from './theme';
import { getTimeBasedMeal, generateHistoryData } from './utils';

import AuthPage from './components/AuthPage';
import DiaryView from './components/DiaryView';
import UserProfileView from './components/UserProfileView';
import AddFoodView from './components/AddFoodView';
import OnboardingModal from './components/OnboardingModal';
import WorkoutPage from './pages/WorkoutPage';
import ConfirmModal from './components/ConfirmModal';
import WorkoutTrackingPage from './pages/WorkoutTrackingPage';
import WorkoutSessionDetailPage from './pages/WorkoutSessionDetailPage';
import { useTodayBurned } from './hooks/useTodayBurned';

const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold">App Crashed</h2>
                <p className="text-gray-400 mt-2 text-sm">Reference or Variable Error Detected.</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-blue-600 rounded-full font-bold">Reload App</button>
                <pre className="mt-8 p-4 bg-gray-900 rounded text-[10px] text-left w-full overflow-auto text-red-300 opacity-50">
                    {this.state.error?.toString()}
                </pre>
            </div>
        );
        return this.props.children;
    }
}

// ==========================================
// 2. UI PRIMITIVES
// ==========================================

const Toggle = ({ checked, onChange, theme }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${checked ? (theme === 'wooden' ? 'bg-[#8B4513]' : 'bg-[#FF9F0A]') : 'bg-gray-400'}`}
    >
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const NavButton = ({ active, onClick, icon, label, isSpecial, theme, customActiveColor, customInactiveColor }) => {
    let colorClass = 'text-gray-400';
    if (active) {
        if (theme === 'dark') colorClass = 'text-white';
        else if (theme === 'wooden') colorClass = 'text-[#3E2723]';
        else colorClass = 'text-black';
    } else {
        if (theme === 'wooden') colorClass = 'text-[#8D6E63]';
    }

    const specialColor = theme === 'wooden' ? 'text-[#556B2F]' : (theme === 'dark' ? 'text-[#BF5AF2]' : 'text-indigo-500');

    let styleObj = {};
    if (customActiveColor && active) styleObj.color = customActiveColor;
    else if (customInactiveColor && !active) styleObj.color = customInactiveColor;

    if (isSpecial) {
        return (
            <button 
                onClick={onClick} 
                className="relative -top-8 flex items-center justify-center"
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${theme === 'dark' ? 'bg-blue-600 shadow-blue-900/40 text-white' : 'bg-blue-500 shadow-blue-200 text-white'}`}>
                    <Plus size={32} strokeWidth={3} />
                </div>
            </button>
        );
    }

    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center w-16 gap-1 group">
            <div className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100 opacity-70'} ${(!customActiveColor && !customInactiveColor) ? colorClass : ''}`} style={styleObj}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold tracking-tight uppercase transition-all duration-200 ${active ? (theme === 'dark' ? 'text-white' : 'text-black') : 'text-gray-500'} ${active ? 'opacity-100' : 'opacity-70'}`}>
                {label}
            </span>
        </button>
    );
};

const CircularProgress = ({ value, max, size = 200, strokeWidth = 18, theme }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const safeValue = isNaN(value) ? 0 : value;
    const safeMax = isNaN(max) ? 2000 : max;
    const progress = Math.min(safeValue / safeMax, 1);
    const dashoffset = circumference - progress * circumference;

    const styles = THEMES[theme];
    const activeColor = styles.chart.c; // Use Carb color (Green/Olive) as main
    const trackColor = styles.ringTrack;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {theme === 'dark' && (
                <div className="absolute inset-0 rounded-full blur-2xl opacity-20" style={{ background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)` }} />
            )}
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={activeColor} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" className="transition-all duration-[1.5s] ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className={`text-sm font-bold tracking-widest uppercase mb-1 ${styles.textSec}`}>Remaining</span>
                <span className={`text-5xl font-extrabold tracking-tighter ${styles.textMain}`}>{Math.max(0, safeMax - safeValue)}</span>
                <span className={`text-xs font-semibold mt-2 ${styles.textSec}`}>Goal: {safeMax}</span>
            </div>
        </div>
    );
};

const ActivityRings = ({ food, burn, water, size = 260, theme }) => {
    const center = size / 2;
    const strokeWidth = 14;
    const gap = 4;
    const styles = THEMES[theme];

    // Ring 1: Food
    const r1 = (size - strokeWidth) / 2;
    const c1 = 2 * Math.PI * r1;
    const foodPct = Math.min(food.current / (food.max || 2000), 1);
    const off1 = c1 - (foodPct * c1);

    // Ring 2: Burn
    const r2 = r1 - strokeWidth - gap;
    const c2 = 2 * Math.PI * r2;
    const burnPct = Math.min(burn.current / (burn.max || 2000), 1);
    const off2 = c2 - (burnPct * c2);

    // Ring 3: Water
    const r3 = r2 - strokeWidth - gap;
    const c3 = 2 * Math.PI * r3;
    const waterPct = Math.min(water.current / (water.max || 20), 1);
    const off3 = c3 - (waterPct * c3);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {theme === 'dark' && (
                <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)' }} />
            )}
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                {/* Tracks */}
                <circle cx={center} cy={center} r={r1} stroke={styles.ringTrack} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
                <circle cx={center} cy={center} r={r2} stroke={styles.ringTrack} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
                <circle cx={center} cy={center} r={r3} stroke={styles.ringTrack} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />

                {/* Progress */}
                <circle cx={center} cy={center} r={r1} stroke={styles.chart.c} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={c1} strokeDashoffset={off1} strokeLinecap="round" className="transition-all duration-[1.5s] ease-out" />
                <circle cx={center} cy={center} r={r2} stroke={styles.chart.f} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={c2} strokeDashoffset={off2} strokeLinecap="round" className="transition-all duration-[1.5s] ease-out delay-100" />
                <circle cx={center} cy={center} r={r3} stroke={styles.chart.p} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={c3} strokeDashoffset={off3} strokeLinecap="round" className="transition-all duration-[1.5s] ease-out delay-200" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                <span className={`text-4xl font-extrabold tracking-tighter ${styles.textMain}`}>{Math.max(0, food.max - food.current)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.textSec}`}>Left</span>
            </div>
        </div>
    );
};

const MacroPill = ({ label, value, max, theme }) => {
    const styles = THEMES[theme];
    let barColor = styles.chart.p;
    if (label === 'Carbs') barColor = styles.chart.c;
    if (label === 'Fat') barColor = styles.chart.f;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between px-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec}`}>{label}</span>
                <span className={`text-[11px] font-bold ${styles.textMain}`}>{value}g</span>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#2C2C2E]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-gray-100')}`}>
                <div className="h-full rounded-full shadow-sm transition-all duration-700 ease-out" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: barColor }} />
            </div>
        </div>
    );
};

const MacroDonutChart = ({ protein, carbs, fat, size = 160, theme }) => {
    const p = protein || 0; const c = carbs || 0; const f = fat || 0;
    const total = p + c + f || 1;
    const radius = (size - 20) / 2;
    const circumference = radius * 2 * Math.PI;
    const styles = THEMES[theme];

    const pOffset = 0;
    const cOffset = -((p / total) * circumference);
    const fOffset = -(((p + c) / total) * circumference);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.ringTrack} strokeWidth="20" fill="transparent" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.p} strokeWidth="20" fill="transparent" strokeDasharray={`${(p / total) * circumference} ${circumference}`} strokeDashoffset={pOffset} />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.c} strokeWidth="20" fill="transparent" strokeDasharray={`${(c / total) * circumference} ${circumference}`} strokeDashoffset={cOffset} />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.f} strokeWidth="20" fill="transparent" strokeDasharray={`${(f / total) * circumference} ${circumference}`} strokeDashoffset={fOffset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xs font-bold uppercase ${styles.textSec}`}>Total</span>
                <span className={`text-2xl font-bold ${styles.textMain}`}>{Math.round((p * 4) + (c * 4) + (f * 9))}</span>
                <span className={`text-[10px] ${styles.textSec}`}>kcal</span>
            </div>
        </div>
    );
};

const MealMacroSummary = ({ foods, theme }) => {
    const stats = useMemo(() => {
        if (!foods) return { cals: 0, pro: 0, carb: 0, fat: 0 };
        return foods.reduce((acc, item) => ({
            cals: acc.cals + (item.calories || 0),
            pro: acc.pro + (item.protein || 0),
            carb: acc.carb + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });
    }, [foods]);

    if (stats.cals === 0) return null;

    const totalGrams = stats.pro + stats.carb + stats.fat || 1;
    const pPct = (stats.pro / totalGrams) * 100;
    const cPct = (stats.carb / totalGrams) * 100;
    const fPct = (stats.fat / totalGrams) * 100;

    const styles = THEMES[theme];

    return (
        <div className={`mt-2 mb-4 p-3 rounded-xl border animate-fade-in ${styles.bg} ${styles.border}`}>
            <div className={`flex h-2 w-full rounded-full overflow-hidden mb-2 ${theme === 'dark' ? 'bg-[#2C2C2E]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-white')}`}>
                <div style={{ width: `${pPct}%`, backgroundColor: styles.chart.p }} className="transition-all duration-500" />
                <div style={{ width: `${cPct}%`, backgroundColor: styles.chart.c }} className="transition-all duration-500" />
                <div style={{ width: `${fPct}%`, backgroundColor: styles.chart.f }} className="transition-all duration-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold tracking-wide">
                <div className="flex items-center gap-1.5 justify-start">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.p }}></div>
                    <span className={styles.textSec}>{stats.pro.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.c }}></div>
                    <span className={styles.textSec}>{stats.carb.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.f }}></div>
                    <span className={styles.textSec}>{stats.fat.toFixed(0)}g</span>
                </div>
            </div>
        </div>
    )
};

const FoodItem = ({ food, theme, isSelectionMode, isSelected, onClick, onToggleSelect }) => {
    const isHighCalorie = food.calories > 500;
    const styles = THEMES[theme];

    return (
        <div
            onClick={() => isSelectionMode ? onToggleSelect(food) : onClick(food)}
            className={`
          relative p-4 flex justify-between items-center transition-all duration-200 ease-out rounded-xl border mb-3 cursor-pointer
          ${isHighCalorie
                    ? (theme === 'dark' ? 'bg-[#1C1C1E] border-red-500/50' : 'bg-red-50 border-red-100')
                    : styles.bg + ' ' + styles.border}
      `}
        >
            <div className="flex items-center gap-3">
                {isSelectionMode && (
                    <div className={`mr-1 transition-all ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                        {isSelected ? <CheckSquare size={20} className="text-current" /> : <Square size={20} />}
                    </div>
                )}

                <div className={`flex items-center justify-center w-8 h-8 rounded-full overflow-hidden shrink-0 ${isHighCalorie
                    ? (theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-100')
                    : (theme === 'dark' ? 'bg-green-500/10' : (theme === 'wooden' ? 'bg-[#556B2F]/20' : 'bg-emerald-100'))
                    }`}>
                    {isHighCalorie ? (
                        <Flame size={16} color="#FF453A" fill="currentColor" className="animate-pulse" />
                    ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${theme === 'wooden' ? 'bg-[#556B2F]' : (theme === 'dark' ? 'bg-green-500' : 'bg-emerald-600')}`} />
                    )}
                </div>

                <div className="flex flex-col">
                    <span className={`text-base font-semibold ${isHighCalorie ? 'text-[#FF3B30]' : styles.textMain}`}>{food.name}</span>
                    {food.weight && <span className={`text-xs ${styles.textSec}`}>{food.weight}</span>}
                </div>
            </div>

            <div className="flex flex-col items-end justify-center h-full">
                <span className={`text-sm font-bold ${isHighCalorie ? 'text-[#FF3B30]' : styles.textSec}`}>
                    {food.calories}
                </span>
            </div>
        </div>
    );
};

const FoodDetailModal = ({ food, theme, onClose, onEdit, onDelete }) => {
    if (!food) return null;
    const styles = THEMES[theme];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl transform transition-all scale-100 border ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-2xl font-bold ${styles.textMain}`}>{food.name}</h2>
                        <p className={`font-medium text-sm ${styles.textSec}`}>{food.weight || '1 Serving'} • {food.meal}</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${styles.bg} ${styles.textSec}`}><X size={20} /></button>
                </div>
                <div className="flex flex-col items-center mb-8">
                    <MacroDonutChart protein={food.protein} carbs={food.carbs} fat={food.fat} theme={theme} />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-blue-50 border-blue-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#3E2723]' : (theme === 'dark' ? 'text-blue-400' : 'text-blue-500')}`}>Protein</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.protein}g</p></div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-emerald-50 border-emerald-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#556B2F]' : (theme === 'dark' ? 'text-green-400' : 'text-emerald-500')}`}>Carbs</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.carbs}g</p></div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-orange-50 border-orange-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#8B4513]' : (theme === 'dark' ? 'text-orange-400' : 'text-orange-500')}`}>Fat</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.fat}g</p></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { onEdit(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-slate-700'}`}><Edit2 size={18} /> Edit</button>
                    <button onClick={() => { onDelete(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#FF453A]/10 text-[#FF453A]' : 'bg-red-50 text-red-600'}`}><Trash2 size={18} /> Delete</button>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({
    logs, exercises, userStats, setUserStats, totals, goal, waterIntake,
    theme, toggleTheme, updateWater, onAddClick, onAddExercise,
    onEditFood, onDeleteFood, onFoodClick, onDeleteBatch,
    selectionState, toggleSelectionMode, toggleItemSelection,
    onGenerateInsight, currentDate, setCurrentDate,
    onEditExercise, onDeleteExercise
}) => {
    const { totalBurned, loading: burnedLoading } = useTodayBurned(currentDate);
    const burned = totalBurned; // Alias for existing references
    const [dayActivities, setDayActivities] = useState([]);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        const qAll = query(
            collection(db, 'activities'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(qAll, (snapshot) => {
            const start = new Date(currentDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(currentDate);
            end.setHours(23, 59, 59, 999);
            const startTime = start.getTime();
            const endTime = end.getTime();

            const actList = [];
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const docTime = data.date?.toMillis ? data.date.toMillis() : 0;
                if (docTime >= startTime && docTime <= endTime) {
                    actList.push({ id: doc.id, ...data });
                }
            });
            // sorted ascending
            actList.sort((a, b) => {
                const ta = a.date?.toMillis ? a.date.toMillis() : 0;
                const tb = b.date?.toMillis ? b.date.toMillis() : 0;
                return ta - tb;
            });
            setDayActivities(actList);
        });
        return () => unsubscribe();
    }, [currentDate]);

    const displayDuration = (activity) => {
        if (activity.type === 'gps') {
            const mins = Math.floor((activity.duration || 0) / 60);
            return mins + ' min';
        } else {
            return (activity.duration || 0) + ' min';
        }
    };

    const styles = THEMES[theme] || THEMES.dark;
    const [insight, setInsight] = useState(null);
    const [loadingInsight, setLoadingInsight] = useState(false);
    const [swipedExerciseId, setSwipedExerciseId] = useState(null);

    // Touch handlers for swipe
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = (id) => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            setSwipedExerciseId(id);
        }
        if (isRightSwipe) {
            setSwipedExerciseId(null);
        }
    };

    const handleInsight = async () => {
        setLoadingInsight(true);
        const res = await onGenerateInsight({ totals, burned, waterIntake, goal });
        setInsight(res);
        setLoadingInsight(false);
    };

    const estimateDate = useMemo(() => {
        if (!userStats.targetWeight || !userStats.weight) return null;
        const diff = Math.abs(userStats.weight - userStats.targetWeight);
        if (diff === 0) return "Achieved!";
        const days = userStats.targetDays || 90;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [userStats]);

    const changeDate = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const isToday = new Date().toDateString() === currentDate.toDateString();

    const emojiMap = {
        running: '🏃',
        walking: '🚶',
        cycling: '🚴',
        skipping: '🦘',
        gym: '🏋️',
        other: '⚡'
    };

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => changeDate(-1)} className={`p-1 rounded-full hover:bg-gray-200/20 ${styles.textSec}`}><ChevronRight size={16} className="rotate-180" /></button>
                        <h2 className={`text-sm font-semibold uppercase tracking-widest ${styles.textSec}`}>
                            {isToday ? "Today" : currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h2>
                        {!isToday && <button onClick={() => changeDate(1)} className={`p-1 rounded-full hover:bg-gray-200/20 ${styles.textSec}`}><ChevronRight size={16} /></button>}
                    </div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Activity Center</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${styles.card} ${styles.border} ${styles.textMain}`}>
                        {theme === 'light' ? <Sun size={20} /> : (theme === 'dark' ? <Moon size={20} /> : <TreeDeciduous size={20} />)}
                    </button>
                </div>
            </div>

            {/* --- GEMINI COACH CARD --- */}
            <div className={`rounded-[2rem] p-6 border relative overflow-hidden transition-colors duration-300 ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${styles.textMain}`}>
                            <Sparkles size={18} className={theme === 'dark' ? 'text-[#BF5AF2]' : 'text-indigo-500'} />
                            Gemini Coach
                        </h3>
                        {!insight && <p className={`text-xs ${styles.textSec} mt-1`}>Get AI-powered daily analysis</p>}
                    </div>
                    <button
                        onClick={handleInsight}
                        disabled={loadingInsight}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${loadingInsight ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${theme === 'dark' ? 'bg-[#BF5AF2] text-white' : 'bg-indigo-600 text-white'}`}
                    >
                        {loadingInsight ? 'Thinking...' : (insight ? 'Refresh' : 'Analyze Day')}
                    </button>
                </div>

                {insight && (
                    <div className="animate-fade-in">
                        <div className={`p-3 rounded-xl mb-2 border-l-4 ${theme === 'dark' ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'}`}>
                            <p className={`text-sm font-medium italic ${styles.textMain}`}>"{insight.praise}"</p>
                        </div>
                        <div className={`p-3 rounded-xl border-l-4 ${theme === 'dark' ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
                            <p className={`text-sm font-medium ${styles.textMain}`}>💡 {insight.advice}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className={`rounded-[2.5rem] p-6 flex flex-col items-center relative transition-colors duration-300 border ${styles.card} ${styles.border}`}>
                <ActivityRings food={{ current: totals.cals, max: goal + totalBurned }} burn={{ current: totalBurned, max: 2000 }} water={{ current: waterIntake, max: 20 }} theme={theme} isDark={theme === 'dark'} />

                {/* ALIGNED GRID */}
                <div className="grid grid-cols-3 w-full mt-6 gap-2 text-center">
                    <div className="flex flex-col items-center gap-1 justify-end h-16">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec}`}>Eaten</span>
                        <span className={`text-lg font-bold h-8 flex items-center ${styles.textMain}`}>{totals.cals}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 justify-end h-16">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec}`}>Burned</span>
                        {burnedLoading 
                            ? <div className={`h-5 w-10 mt-1.5 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} /> 
                            : <span className={`text-lg font-bold h-8 flex items-center ${styles.textMain}`}>{totalBurned}</span>
                        }
                    </div>
                    <div className="flex flex-col items-center gap-1 justify-end h-16">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec}`}>Water</span>
                        <div className="flex items-center justify-center h-8 gap-1">
                            <button onClick={() => updateWater(-1)} className={`w-7 h-7 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><Minus size={14} strokeWidth={3} /></button>
                            <span className={`text-xs font-bold w-8 text-center leading-none ${styles.textSec}`}>250<br /><span className="text-[8px] opacity-60">ml</span></span>
                            <button onClick={() => updateWater(1)} className={`w-7 h-7 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}`}><Plus size={14} strokeWidth={3} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-3xl p-4 border ${styles.card} ${styles.border}`}>
                <div className="grid grid-cols-3 gap-4">
                    <MacroPill label="Protein" value={totals.pro.toFixed(0)} max={180} color="bg-blue-500" theme={theme} isDark={theme === 'dark'} />
                    <MacroPill label="Carbs" value={totals.carb.toFixed(0)} max={250} color="bg-emerald-500" theme={theme} isDark={theme === 'dark'} />
                    <MacroPill label="Fat" value={totals.fat.toFixed(0)} max={80} color="bg-orange-500" theme={theme} isDark={theme === 'dark'} />
                </div>
            </div>

            <div>
                <h3 className={`text-lg font-bold mb-3 px-1 ${styles.textMain}`}>Meals</h3>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
                        const mealCals = logs[meal].reduce((acc, i) => acc + i.calories, 0);
                        const isSelectionMode = selectionState.meal === meal;
                        return (
                            <div key={meal} className="snap-center min-w-[85vw] md:min-w-[320px]">
                                <div className={`rounded-[2.5rem] p-6 h-full border relative overflow-hidden transition-all ${styles.card} ${styles.border}`}>
                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                                <Utensils size={18} />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-extrabold tracking-tight ${styles.textMain}`}>{meal}</h3>
                                                <p className={`text-xs font-medium ${styles.textSec}`}>Log & track</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleSelectionMode(meal)} className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'bg-blue-500 text-white' : (theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-400')}`}><CheckSquare size={16} /></button>
                                            {isSelectionMode && selectionState.selectedIds.size > 0 ? (
                                                <button onClick={() => onDeleteBatch(meal)} className={`text-xs font-bold px-3 py-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>Delete ({selectionState.selectedIds.size})</button>
                                            ) : (
                                                <div className={`px-3 py-1.5 rounded-full font-bold text-sm ${theme === 'dark' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                    {mealCals} <span className="text-[10px] opacity-70">kcal</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <MealMacroSummary foods={logs[meal]} theme={theme} isDark={theme === 'dark'} />

                                    <div className="min-h-[100px] mt-4">
                                        {logs[meal].length > 0 ? (
                                            <div className="space-y-2">
                                                {logs[meal].map((food) => (
                                                    <FoodItem key={food.uid} food={food} theme={theme} isDark={theme === 'dark'} isSelectionMode={isSelectionMode} isSelected={selectionState.selectedIds.has(food.uid)} onClick={onFoodClick} onToggleSelect={toggleItemSelection} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`flex flex-col items-center justify-center h-32 gap-3 border-2 border-dashed rounded-[1.5rem] ${theme === 'dark' ? 'border-white/5' : 'border-gray-200/50'}`}>
                                                <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                    <Plus size={20} className={`opacity-40 ${styles.textSec}`} />
                                                </div>
                                                <span className={`text-xs font-medium opacity-50 ${styles.textSec}`}>No food logged</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>



            {/* --- FITNESS HUB --- */}
            <div className={`rounded-[2.5rem] p-6 border relative overflow-hidden ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${styles.textMain}`}>
                            <Activity size={20} className={theme === 'dark' ? 'text-red-500' : 'text-red-600'} />
                            Fitness Hub
                        </h3>
                        <p className={`text-[11px] font-medium ${styles.textSec}`}>Track your burn & stats</p>
                    </div>
                    <button
                        onClick={onAddExercise}
                        className={`group px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap ${theme === 'dark' ? 'bg-red-600 text-white shadow-red-900/10 hover:bg-red-500' : 'bg-red-500 text-white shadow-red-200 hover:bg-red-600'}`}
                    >
                        <Plus size={14} strokeWidth={3} /> Log Activity
                    </button>
                </div>



                {/* Burn Summary Card */}
                <div className={`mb-8 p-5 rounded-[2rem] flex items-center justify-between relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-100'}`}>
                    <div className="relative z-10">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Total Burned</p>
                        <h4 className={`text-4xl font-black ${styles.textMain}`}>
                            {burnedLoading ? '...' : totalBurned}
                            <span className="text-base font-bold opacity-60 ml-1">kcal</span>
                        </h4>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-200'}`}>
                        <Flame size={32} fill="currentColor" />
                    </div>
                </div>

                {/* Activities List */}
                <div className="space-y-3 relative z-10">
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${styles.textSec}`}>Today's Activities</h4>
                    {dayActivities.length > 0 ? (
                        dayActivities.map((item, i) => (
                            <div
                                key={item.id || i}
                                className="relative overflow-hidden rounded-2xl"
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={() => onTouchEnd(item.id)}
                            >
                                {/* Actions Background */}
                                <div className={`absolute inset-0 flex items-center justify-end px-4 gap-2 ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
                                    <button
                                        onClick={() => onEditExercise(item)}
                                        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteExercise(item.id)}
                                        className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600'} transition-transform active:scale-90`}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {/* Content Foreground */}
                                <div
                                    className={`relative p-4 flex justify-between items-center transition-transform duration-300 border ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-slate-100 shadow-sm')}`}
                                    style={{ transform: swipedExerciseId === item.id ? 'translateX(-110px)' : 'translateX(0)' }}
                                    onClick={() => swipedExerciseId === item.id && setSwipedExerciseId(null)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                            <span className="text-xl">{emojiMap[item.activityType] || '⚡'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-base font-bold capitalize ${styles.textMain}`}>{item.activityType}</span>
                                            <span className={`text-xs font-medium ${styles.textSec}`}>
                                                {item.distance > 0 ? `${item.distance} km • ` : ''}
                                                {displayDuration(item)}
                                                {item.type === 'gps' ? ' • 📍 GPS' : ' • ✏️ Manual'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-lg font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>-{item.caloriesBurned}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`text-center py-8 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                            <p className={`text-sm font-medium ${styles.textSec}`}>No activities logged yet.</p>
                            <button onClick={onAddExercise} className="text-xs font-bold text-blue-500 mt-2 hover:underline">Log your first activity</button>
                        </div>
                    )}
                </div>

                {/* Target Date */}
                {userStats.targetWeight && (
                    <div className={`mt-6 pt-6 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200/50'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600'}`}>
                                    <TrendingDown size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <p className={`text-[10px] font-bold uppercase tracking-tight opacity-50 ${styles.textMain}`}>Estimated Goal Date</p>
                                    <p className={`text-xs font-bold ${styles.textMain}`}>Reach <span className="text-[#ff5733]">{userStats.targetWeight}kg</span></p>
                                </div>
                            </div>
                            <div className={`text-lg font-black tracking-tighter ${styles.textMain}`}>{estimateDate || '--'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const EditDayModal = ({ day, theme, onClose, onSave }) => {
    const styles = THEMES[theme];
    const [burned, setBurned] = useState(day.burned || 0);
    const [consumed, setConsumed] = useState(day.totals?.cals || 0);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl transform transition-all scale-100 border ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-2xl font-bold ${styles.textMain}`}>Edit Log</h2>
                        <p className={`font-medium text-sm ${styles.textSec}`}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${styles.bg} ${styles.textSec}`}><X size={20} /></button>
                </div>

                <div className="space-y-4 mb-8">
                    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <label className={`text-xs font-bold uppercase mb-2 block ${styles.textSec}`}>Consumed (kcal)</label>
                        <input
                            type="number"
                            value={consumed}
                            onChange={(e) => setConsumed(e.target.value)}
                            className={`w-full bg-transparent text-3xl font-bold outline-none ${styles.textMain}`}
                        />
                        <p className="text-[10px] opacity-50 mt-1">Overriding this will desync from food items.</p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                        <label className={`text-xs font-bold uppercase mb-2 block ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Burned (kcal)</label>
                        <input
                            type="number"
                            value={burned}
                            onChange={(e) => setBurned(e.target.value)}
                            className={`w-full bg-transparent text-3xl font-bold outline-none ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                        />
                    </div>
                </div>

                <button
                    onClick={() => onSave(day.date, burned, consumed)}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 ${theme === 'dark' ? 'bg-blue-600 shadow-blue-900/20' : 'bg-black shadow-gray-400/20'}`}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

const MainApp = () => {
    const [currentView, setCurrentView] = useState('home');
    const [saveStatus, setSaveStatus] = useState('Idle');
    const [currentDate, setCurrentDate] = useState(new Date()); // Date object

    const [showAddModal, setShowAddModal] = useState({ visible: false, type: 'food' });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedMealForAdd, setSelectedMealForAdd] = useState('Breakfast');
    const [initialSearchTerm, setInitialSearchTerm] = useState('');
    const [editingFood, setEditingFood] = useState(null);
    const [theme, setTheme] = useState('light'); // light, dark, wooden
    const [selectedWorkoutSessionId, setSelectedWorkoutSessionId] = useState(null);

    const [selectionState, setSelectionState] = useState({ meal: null, selectedIds: new Set() });
    const [userStats, setUserStats] = useState({ age: 25, weight: 70, height: 175, targetWeight: 65, targetDays: 90 });
    const [exercises, setExercises] = useState([]);
    const [goal, setGoal] = useState(2200);
    const [waterIntake, setWaterIntake] = useState(4);
    const [logs, setLogs] = useState({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, activityId: null });

    // Edit Day Modal State (kept for direct edits if needed, but now we redirect to home)
    const [showEditDayModal, setShowEditDayModal] = useState(false);

    const [selectedDayToEdit, setSelectedDayToEdit] = useState(null);


    const handleDayClick = (day) => {
        // Instead of modal, go to home for that date
        const [y, m, d] = day.date.split('-');
        setCurrentDate(new Date(y, m - 1, d));
        setCurrentView('home');
    };

    const handleSaveDayEdit = async (dayId, newBurned, newConsumed) => {
        // ... (keep existing logic if we still use modal for something else, or remove if fully replaced)
        // For now, I'll keep it but it won't be triggered by handleDayClick anymore
        try {
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', dayId), {
                burned: Number(newBurned),
                totals: { ...selectedDayToEdit.totals, cals: Number(newConsumed) }
            }, { merge: true });
            setShowEditDayModal(false);
        } catch (e) {
            console.error("Error updating day:", e);
            alert("Failed to update.");
        }
    };

    const totals = useMemo(() => {
        return logs.Breakfast.concat(logs.Lunch, logs.Dinner, logs.Snacks).reduce((acc, item) => ({
            cals: acc.cals + (item.calories || 0),
            pro: acc.pro + (item.protein || 0),
            carb: acc.carb + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });
    }, [logs]);

    // --- FIREBASE AUTH & SYNC ---
    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth not initialized");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                try {
                    // Fetch User Stats
                    const userRef = doc(db, 'users', u.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.userStats) setUserStats(data.userStats);
                        else setShowOnboarding(true);
                        if (data.theme) setTheme(data.theme);
                    } else {
                        setShowOnboarding(true);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setLoading(false);
                setCurrentView('home');
            }
        });
        return () => unsubscribe();
    }, []);

    // --- SYNC LOGS FOR CURRENT DATE ---
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // Format date as YYYY-MM-DD in local time
        const offset = currentDate.getTimezoneOffset();
        const localDate = new Date(currentDate.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];

        const logRef = doc(db, 'users', user.uid, 'daily_logs', dateStr);

        const unsubLogs = onSnapshot(logRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setLogs(data.foodLogs || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
                setExercises(data.exercises || []);
                setWaterIntake(data.waterIntake || 0);
            } else {
                setLogs({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
                setExercises([]);
                setWaterIntake(0);
            }
            setLoading(false);
        });

        return () => unsubLogs();
    }, [user, currentDate]);

    // --- AUTO-SAVE USER STATS & THEME ---
    useEffect(() => {
        if (!user) return;
        const saveStats = async () => {
            try {
                await setDoc(doc(db, 'users', user.uid), { userStats, theme }, { merge: true });
                console.log("Stats saved successfully");
            } catch (e) {
                console.error("Error saving stats", e);
                alert("Failed to save data. Please check your connection.");
            }
        };
        const timeout = setTimeout(saveStats, 1000);
        return () => clearTimeout(timeout);
    }, [userStats, theme, user]);

    // --- AUTO-SAVE LOGS ---
    useEffect(() => {
        if (!user || loading) return;
        const saveLogs = async () => {
            setSaveStatus('Saving...');
            try {
                // Use currentDate for saving
                const offset = currentDate.getTimezoneOffset();
                const localDate = new Date(currentDate.getTime() - (offset * 60 * 1000));
                const dateStr = localDate.toISOString().split('T')[0];

                if (!db) throw new Error("Firestore DB instance is missing");

                await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), {
                    foodLogs: logs,
                    exercises,
                    waterIntake,
                    totals
                }, { merge: true });

                setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`);
            } catch (e) {
                console.error("Error saving logs", e);
                setSaveStatus(`Error: ${e.message}`);
                alert(`Save Failed: ${e.message}`);
            }
        };
        const timeout = setTimeout(saveLogs, 1000); // Debounce 1s
        return () => clearTimeout(timeout);
    }, [logs, exercises, waterIntake, totals, user, loading]);

    // Calculate dynamic goal on stats change
    useEffect(() => {
        const w = Number(userStats.weight) || 70;
        const h = Number(userStats.height) || 170;
        const a = Number(userStats.age) || 25;
        const tw = Number(userStats.targetWeight) || w;
        const days = Number(userStats.targetDays) || 90;

        const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
        const tdee = bmr * 1.3;
        let newGoal = tdee;

        if (tw && w && tw !== w) {
            const weightDiff = Math.abs(w - tw);
            // Raw deficit: 7700 kcal per kg of body fat
            const dailyAdjustment = (weightDiff * 7700) / days;
            if (tw < w) newGoal = tdee - dailyAdjustment;
            if (tw > w) newGoal = tdee + dailyAdjustment;
        }

        // Safe minimum: never go below 1100 kcal or 70% of BMR
        const safeMin = Math.max(1100, Math.round(bmr * 0.7));
        setGoal(Math.max(safeMin, Math.round(newGoal)));
    }, [userStats]);

    const handleAddFood = async (item, mealOrType) => {
        if (mealOrType === 'exercise') {
            try {
                if (editingFood && editingFood.id) {
                    // Update existing activity in the root collection
                    await setDoc(doc(db, 'activities', editingFood.id), {
                        ...item,
                        userId: user.uid,
                        type: 'manual',
                        date: Timestamp.fromDate(currentDate),
                        caloriesBurned: item.calories, // ensure consistency
                        activityType: item.name.toLowerCase()
                    }, { merge: true });
                } else {
                    // Add new manual activity to the root collection
                    await addDoc(collection(db, 'activities'), {
                        ...item,
                        userId: user.uid,
                        type: 'manual',
                        date: Timestamp.fromDate(currentDate),
                        caloriesBurned: item.calories,
                        activityType: item.name.toLowerCase()
                    });
                }
            } catch (error) {
                console.error("Error saving activity:", error);
                alert("Failed to save activity.");
            }
        } else {
            const newFood = { ...item, uid: Date.now().toString() + Math.random(), meal: mealOrType };
            setLogs(prev => {
                const newLogs = { ...prev };
                if (editingFood) {
                    const oldMeal = editingFood.meal || mealOrType;
                    newLogs[oldMeal] = newLogs[oldMeal].filter(f => f.uid !== editingFood.uid);
                }
                newLogs[mealOrType] = [...newLogs[mealOrType], newFood];
                return newLogs;
            });
        }
        setShowAddModal({ visible: false, type: 'food' });
        setInitialSearchTerm('');
        setEditingFood(null);
    };

    const handleEditFood = (food, meal) => {
        setInitialSearchTerm(food.name);
        setEditingFood({ ...food, meal });
        setSelectedMealForAdd(meal);
        setShowAddModal({ visible: true, type: 'food' });
    };

    const handleDeleteFood = (food, meal) => {
        setLogs(prev => ({
            ...prev,
            [meal]: prev[meal].filter(f => f.uid !== food.uid)
        }));
        setShowDetailModal(false);
    };

    const handleBatchDelete = (meal) => {
        setLogs(prev => ({ ...prev, [meal]: prev[meal].filter(f => !selectionState.selectedIds.has(f.uid)) }));
        setSelectionState({ meal: null, selectedIds: new Set() });
    };

    const handleEditExercise = (exercise) => {
        setInitialSearchTerm(exercise.name);
        setEditingFood(exercise); // Reuse editingFood for exercise
        setShowAddModal({ visible: true, type: 'exercise' });
    };

    const handleDeleteExercise = (activityId) => {
        setDeleteConfirm({ isOpen: true, activityId });
    };

    const confirmDeleteExercise = async () => {
        const activityId = deleteConfirm.activityId;
        if (!activityId) return;
        
        try {
            await deleteDoc(doc(db, 'activities', activityId));
            setDeleteConfirm({ isOpen: false, activityId: null });
        } catch (error) {
            console.error("Error deleting activity:", error);
            alert("Failed to delete activity.");
            setDeleteConfirm({ isOpen: false, activityId: null });
        }
    };



    const toggleSelectionMode = (meal) => {
        if (selectionState.meal === meal) setSelectionState({ meal: null, selectedIds: new Set() });
        else setSelectionState({ meal: meal, selectedIds: new Set() });
    };

    const toggleItemSelection = (food) => {
        const newIds = new Set(selectionState.selectedIds);
        if (newIds.has(food.uid)) newIds.delete(food.uid);
        else newIds.add(food.uid);
        setSelectionState({ ...selectionState, selectedIds: newIds });
    };

    const updateWater = (amount) => {
        setWaterIntake(prev => {
            const newVal = prev + amount;
            return newVal < 0 ? 0 : (newVal > 20 ? 20 : newVal);
        });
    };

    const openAddModal = (mealOverride = null, type = 'food') => {
        if (type === 'food') {
            const mealToSet = mealOverride || getTimeBasedMeal();
            setSelectedMealForAdd(mealToSet);
        }
        setInitialSearchTerm('');
        setShowAddModal({ visible: true, type });
    };

    const handleCloseAddModal = () => {
        setShowAddModal({ visible: false, type: 'food' });
        setEditingFood(null);
        setInitialSearchTerm('');
    };

    const handleThemeToggle = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'wooden';
            return 'light';
        });
    };

    const handleOnboardingSave = (stats) => {
        setUserStats(stats);
        setShowOnboarding(false);
    };

    const generateInsight = async (stats) => {
        const prompt = `Act as a fitness coach. User Stats: Goal ${stats.goal}kcal, Eaten ${stats.totals.cals}kcal (P:${stats.totals.pro}g, C:${stats.totals.carb}g, F:${stats.totals.fat}g), Burned ${stats.burned}kcal, Water ${stats.waterIntake * 250}ml.
            Give a short JSON response with two fields: "praise" (max 10 words, encouraging) and "advice" (max 15 words, actionable tip). No markdown.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
        } catch (e) {
            console.error("Gemini Error:", e);
            return { praise: "Keep going!", advice: "Try to hit your protein goal." };
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const styles = THEMES[theme];

    if (loading) return (
        <div className={`h-screen w-full flex flex-col items-center justify-center ${THEMES[theme].bg}`}>
            <Loader2 size={48} className={`animate-spin ${THEMES[theme].textMain}`} />
            <p className={`mt-4 font-bold ${THEMES[theme].textSec}`}>Syncing...</p>
        </div>
    );

    if (!user) return <AuthPage />;

    return (
        <div className={`fixed inset-0 h-[100dvh] w-full font-sans mx-auto overflow-hidden transition-colors duration-500 ${styles.bg}`}>

            <div className="h-full overflow-y-auto custom-scrollbar no-scrollbar pb-24">
                {currentView === 'home' && (
                    <DashboardView
                        logs={logs} exercises={exercises} userStats={userStats} setUserStats={setUserStats}
                        totals={totals} goal={goal} waterIntake={waterIntake} theme={theme} isDark={theme === 'dark'}
                        toggleTheme={handleThemeToggle} updateWater={updateWater}
                        onAddClick={(meal) => openAddModal(meal, 'food')} onAddExercise={() => setCurrentView('workout')}
                        onEditFood={handleEditFood} onDeleteFood={handleDeleteFood}
                        onFoodClick={(food) => { setSelectedFood(food); setShowDetailModal(true); }}
                        onDeleteBatch={handleBatchDelete} selectionState={selectionState}
                        toggleSelectionMode={toggleSelectionMode} toggleItemSelection={toggleItemSelection}
                        onGenerateInsight={generateInsight}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        onEditExercise={handleEditExercise}
                        onDeleteExercise={handleDeleteExercise}
                    />
                )}
                {currentView === 'diary' && <DiaryView theme={theme} user={user} onDayClick={handleDayClick} />}
                {currentView === 'profile' && <UserProfileView theme={theme} user={user} userStats={userStats} setUserStats={setUserStats} onLogout={handleLogout} />}
                {currentView === 'workout' && <WorkoutPage setCurrentView={setCurrentView} setSelectedSessionId={setSelectedWorkoutSessionId} />}
                {currentView === 'workout_tracking' && <WorkoutTrackingPage setCurrentView={setCurrentView} />}
                {currentView === 'workout_session_detail' && <WorkoutSessionDetailPage setCurrentView={setCurrentView} sessionId={selectedWorkoutSessionId} />}
            </div>

            <div className={`fixed bottom-0 left-0 right-0 h-22 flex justify-around items-center z-[70] px-4 pb-[max(12px,env(safe-area-inset-bottom))] border-t shadow-[0_-8px_24px_rgba(0,0,0,0.12)] ${theme === 'dark' ? 'bg-black/98 border-white/5' : 'bg-white/98 border-black/5'}`}>
                <NavButton 
                    label="Home"
                    active={currentView === 'home' && !showAddModal.visible} 
                    onClick={() => { setCurrentView('home'); setShowAddModal(prev => ({ ...prev, visible: false })); }} 
                    icon={<Home size={22} strokeWidth={2.5} />} 
                    isDark={theme === 'dark'} theme={theme} 
                />
                <NavButton 
                    label="Diary"
                    active={currentView === 'diary' && !showAddModal.visible} 
                    onClick={() => { setCurrentView('diary'); setShowAddModal(prev => ({ ...prev, visible: false })); }} 
                    icon={<BookOpen size={22} strokeWidth={2.5} />} 
                    isDark={theme === 'dark'} theme={theme} 
                />
                
                <NavButton 
                    isSpecial 
                    onClick={() => openAddModal(null, 'food')} 
                    theme={theme} 
                />

                <NavButton 
                    label="Workout"
                    active={currentView === 'workout' && !showAddModal.visible} 
                    onClick={() => { setCurrentView('workout'); setShowAddModal(prev => ({ ...prev, visible: false })); }} 
                    icon={<Footprints size={22} strokeWidth={2.5} />} 
                    isDark={theme === 'dark'} theme={theme}
                    customActiveColor="#ff5733" customInactiveColor="#666666" 
                />
                <NavButton 
                    label="Profile"
                    active={currentView === 'profile' && !showAddModal.visible} 
                    onClick={() => { setCurrentView('profile'); setShowAddModal(prev => ({ ...prev, visible: false })); }} 
                    icon={<User size={22} strokeWidth={2.5} />} 
                    isDark={theme === 'dark'} theme={theme} 
                />
            </div>

            {
                showAddModal.visible && (
                    <AddFoodView
                        meal={selectedMealForAdd}
                        type={showAddModal.type}
                        userStats={userStats}
                        isDark={theme === 'dark'}
                        theme={theme}
                        initialTerm={initialSearchTerm}
                        editingFood={editingFood}
                        onClose={handleCloseAddModal}
                        onAdd={handleAddFood}
                        recentFoods={Object.values(logs).flat().slice(-8).reverse()}
                        foodPatterns={(() => {
                            const hour = new Date().getHours();
                            const suggestions = [];
                            // Check if Tea is logged frequently and suggest biscuits
                            const hasTea = Object.values(logs).flat().some(f => f.name?.toLowerCase().includes('tea'));
                            if (hasTea) {
                                suggestions.push("Usually log biscuits with tea? Add Biscuits (~120 kcal)");
                            }
                            // Morning typical breakfast suggestion
                            if (hour >= 6 && hour < 10 && selectedMealForAdd === 'Breakfast') {
                                const breakfastItems = logs.Breakfast || [];
                                if (breakfastItems.length > 2) {
                                    suggestions.push(`Your typical breakfast: ${breakfastItems.slice(0, 2).map(f => f.name).join(' + ')}`);
                                }
                            }
                            return suggestions.length > 0 ? { suggestion: suggestions[0] } : {};
                        })()}
                    />

                )
            }

            {
                showDetailModal && (
                    <FoodDetailModal
                        food={selectedFood}
                        isDark={theme === 'dark'}
                        theme={theme}
                        onEdit={(f) => handleEditFood(f, f.meal)}
                        onDelete={(f) => handleDeleteFood(f, f.meal)}
                        onClose={() => setShowDetailModal(false)}
                    />
                )
            }

            {showEditDayModal && (
                <EditDayModal
                    day={selectedDayToEdit}
                    theme={theme}
                    onClose={() => setShowEditDayModal(false)}
                    onSave={handleSaveDayEdit}
                />
            )}

            {showOnboarding && <OnboardingModal userStats={userStats} onSave={handleOnboardingSave} theme={theme} />}

            <ConfirmModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Activity?"
                message="Are you sure you want to remove this activity from today's log? This cannot be undone."
                onConfirm={confirmDeleteExercise}
                onCancel={() => setDeleteConfirm({ isOpen: false, activityId: null })}
            />
        </div>
    );
};

export default function App() {
    return (
        <ErrorBoundary>
            <MainApp />
        </ErrorBoundary>
    );
}
