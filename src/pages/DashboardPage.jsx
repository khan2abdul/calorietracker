import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Activity, Sun, Moon, TreeDeciduous, Utensils, Minus, Plus, TrendingDown,
    ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import { auth, db } from '../firebase';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { THEMES } from '../theme';
import ActivityRings from '../components/Dashboard/ActivityRings';
import MacroMiniCard from '../components/Dashboard/MacroMiniCard';
import MealChips from '../components/Dashboard/MealChips';
import MealMacroSummary from '../components/Dashboard/MealMacroSummary';
import { FoodItem } from '../components/Dashboard/FoodItem';
import { useTodayBurned } from '../hooks/useTodayBurned';
import WaterInputModal from '../components/WaterInputModal';

const DashboardPage = ({
    logs, userStats, totals, goal, waterIntake,
    theme, toggleTheme, updateWater, onAddClick, onAddExercise,
    onEditFood, onDeleteFood, onFoodClick, onDeleteBatch,
    selectionState, toggleSelectionMode, toggleItemSelection,
    onGenerateInsight, currentDate, setCurrentDate,
    onEditExercise, onDeleteExercise, onRingClick, totalBurned, burnMetrics
}) => {
    const burned = totalBurned || 0; 
    const [dayActivities, setDayActivities] = useState([]);
    const [showWaterModal, setShowWaterModal] = useState(false);

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
            actList.sort((a, b) => {
                const ta = a.date?.toMillis ? a.date.toMillis() : 0;
                const tb = b.date?.toMillis ? b.date.toMillis() : 0;
                return ta - tb;
            });
            setDayActivities(actList);
        });
        return () => unsubscribe();
    }, [currentDate, auth.currentUser]);

    const displayDuration = (activity) => {
        if (activity.type === 'gps') {
            const mins = Math.floor((activity.duration || 0) / 60);
            return mins + ' min';
        } else {
            return (activity.duration || 0) + ' min';
        }
    };

    const styles = THEMES[theme] || THEMES.dark;

    const estimateDate = useMemo(() => {
        if (!userStats.targetWeight || !userStats.weight) return null;
        const diff = Math.abs(userStats.weight - userStats.targetWeight);
        if (diff === 0) return "Achieved!";
        
        let days;
        if (userStats.targetDays === 'Auto') {
            const deficit = (goal - totals.cals) + totalBurned;
            // Standard: 7700 kcal = 1kg
            // We assume a minimum reasonable deficit of 300 if user is overeating or balanced
            const projectedDailyDeficit = deficit > 100 ? deficit : 500; 
            days = Math.ceil((diff * 7700) / projectedDailyDeficit);
            // Cap it to something reasonable
            days = Math.min(Math.max(days, 7), 365);
        } else {
            days = userStats.targetDays || 90;
        }

        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [userStats, totals.cals, totalBurned, goal]);

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good morning";
        if (hours < 17) return "Good afternoon";
        return "Good evening";
    };

    const userName = auth.currentUser?.displayName?.split(' ')[0] || "there";

    const emojiMap = {
        running: '🏃',
        walking: '🚶',
        cycling: '🚴',
        skipping: '🦘',
        gym: '🏋️',
        hiit: '🔥',
        cardio: '❤️‍🔥',
        exercise: '💪',
        other: '⚡'
    };

    const scrollToMeal = (meal) => {
        const element = document.getElementById(`meal-section-${meal}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const waterGoal = 3000; 
    const waterConsumed = waterIntake * 250;
    const netCalChange = totals.cals - totalBurned;

    const macroGoals = useMemo(() => {
        const g = goal || 2000;
        return {
            pro: Math.round((g * 0.30) / 4),
            carb: Math.round((g * 0.40) / 4),
            fat: Math.round((g * 0.30) / 9)
        };
    }, [goal]);

    const changeDate = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
    };

    const isToday = new Date().toDateString() === currentDate.toDateString();

    return (
        <div className="flex flex-col pb-32 animate-fade-in px-6 pt-5 gap-[10px]" style={{ backgroundColor: styles.bg, maxWidth: '430px', margin: '0 auto' }}>
            {/* Header with Date Navigation */}
            <div className="flex justify-between items-start pt-[10px] mb-2">
                <div className="flex-1">
                    <h1 className={`title-text ${styles.textMain}`}>
                        {getGreeting()}, {userName} 👋
                    </h1>
                    
                    <div className="flex items-center gap-3 mt-1 underline-offset-4">
                        <button 
                            onClick={() => changeDate(-1)} 
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm'}`}
                        >
                            <ChevronLeft size={14} />
                        </button>

                        <div className="flex flex-col items-center justify-center min-w-[110px]">
                            <p className={`text-[12px] font-black uppercase tracking-[1px] leading-tight ${styles.textMain}`}>
                                {isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className={`text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-0.5 ${styles.textSec}`}>
                                {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}, {currentDate.getDate()} {currentDate.toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                        </div>

                        <button 
                            onClick={() => changeDate(1)} 
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-sm'}`}
                        >
                            <ChevronRight size={14} />
                        </button>

                        {!isToday && (
                            <button 
                                onClick={() => setCurrentDate(new Date())}
                                className={`ml-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 ${theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-500 text-white shadow-md'}`}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border shadow-sm ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/20 text-[#3E2723]' : (theme === 'dark' ? 'bg-[#1e1e1e] border-white/5 text-white' : 'bg-white border-gray-100 text-slate-800')}`}>
                        {theme === 'light' ? <Sun size={18} /> : (theme === 'dark' ? <Moon size={18} /> : <TreeDeciduous size={18} />)}
                    </button>
                </div>
            </div>

            {/* Block 0: Goal Projection */}
            {userStats.targetWeight && (
                <div className={`rounded-[2rem] p-4 border shadow-md transition-all active:scale-[0.98] ${styles.card} ${styles.border}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                <TrendingDown size={20} />
                            </div>
                            <div className="flex flex-col">
                                <p className={`text-[9px] font-bold uppercase tracking-tight opacity-50 ${styles.textMain}`}>Estimated Goal Date</p>
                                <p className={`text-xs font-bold ${styles.textMain}`}>Reach <span className="text-[#ff5733]">{userStats.targetWeight}kg</span></p>
                            </div>
                        </div>
                        <div className={`text-lg font-black tracking-tighter ${styles.textMain}`}>{estimateDate || '--'}</div>
                    </div>
                </div>
            )}

            {/* Block 1: Ring Card */}
            <div className={`rounded-[2rem] p-[20px] shadow-lg transition-shadow duration-500 cursor-pointer active:scale-[0.98] transition-transform ${styles.card} ${styles.border} ${totals.cals > goal ? 'shadow-red-500/10' : 'shadow-green-500/10'}`}>
                <ActivityRings 
                    food={{ current: totals.cals, max: goal }} 
                    burn={{ current: totalBurned, max: 1000 }} 
                    water={{ current: waterConsumed, max: waterGoal }} 
                    theme={theme} 
                    onClick={onRingClick}
                />
            </div>

            {/* Block 2: Stats Pills */}
            <div className="grid grid-cols-3 gap-3">
                {/* Eaten */}
                <div className="relative rounded-full w-full aspect-square flex flex-col items-center justify-center overflow-hidden"
                     style={{ background: 'radial-gradient(circle at 50% 40%, rgba(245,158,11,0.45) 0%, rgba(245,158,11,0.15) 50%, rgba(245,158,11,0.05) 100%)', border: '2px solid rgba(245,158,11,0.5)', boxShadow: '0 0 40px rgba(245,158,11,0.35), inset 0 0 20px rgba(245,158,11,0.1)' }}>
                    <p className="relative text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">Eaten</p>
                    <p className="relative text-3xl font-black text-amber-50 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">{Math.round(totals.cals)}<span className="text-[11px] font-bold text-amber-200/70 ml-1">kcal</span></p>
                </div>

                {/* Burned */}
                <div className="relative rounded-full w-full aspect-square flex flex-col items-center justify-center overflow-hidden"
                     style={{ background: theme === 'dark' ? 'linear-gradient(180deg, rgba(60,60,70,0.6) 0%, rgba(40,40,50,0.4) 100%)' : 'linear-gradient(180deg, rgba(60,60,70,0.15) 0%, rgba(40,40,50,0.05) 100%)', border: '1px solid rgba(100,100,120,0.25)' }}>
                    {/* Progress bar at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out" style={{ height: `${Math.min((totalBurned / goal) * 100, 100)}%` }}>
                        <div className="absolute inset-0" style={{ background: netCalChange <= 0 ? 'linear-gradient(to top, rgba(52,199,89,0.5) 0%, rgba(52,199,89,0.15) 100%)' : 'linear-gradient(to top, rgba(255,149,0,0.5) 0%, rgba(255,149,0,0.15) 100%)' }} />
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: netCalChange <= 0 ? 'rgba(52,199,89,0.8)' : 'rgba(255,149,0,0.8)', boxShadow: netCalChange <= 0 ? '0 0 8px rgba(52,199,89,0.6)' : '0 0 8px rgba(255,149,0,0.6)' }} />
                    </div>
                    <p className="relative text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Burned</p>
                    <p className="relative text-2xl font-black text-white">{Math.round(totalBurned)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">kcal</span></p>
                </div>

                {/* Water */}
                <button 
                    onClick={() => setShowWaterModal(true)}
                    className="relative rounded-full w-full aspect-square flex flex-col items-center justify-center overflow-hidden transition-all active:scale-95"
                     style={{ background: theme === 'dark' ? 'linear-gradient(180deg, rgba(30,60,114,0.5) 0%, rgba(20,40,80,0.3) 100%)' : 'linear-gradient(180deg, rgba(30,60,114,0.15) 0%, rgba(20,40,80,0.05) 100%)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 35px rgba(59,130,246,0.15)' }}>
                    {/* Water fill */}
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out" style={{ height: `${Math.min((waterConsumed / 3000) * 100, 100)}%` }}>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0.2) 100%)' }} />
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'rgba(96,165,250,0.8)', boxShadow: '0 0 8px rgba(96,165,250,0.6)' }} />
                    </div>
                    <p className="relative text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Water</p>
                    <p className="relative text-2xl font-black text-blue-50">{(waterConsumed / 1000).toFixed(1)}<span className="text-[10px] font-bold text-blue-200/60">/3.0L</span></p>
                </button>
            </div>

            {/* Block 3: Macros */}
            <div className={`rounded-[2rem] p-5 shadow-lg ${styles.card} ${styles.border}`}>
                <div className="grid grid-cols-3 gap-3">
                    {/* Carbs */}
                    <div className={`rounded-2xl p-4 flex flex-col items-center ${theme === 'dark' ? 'bg-gradient-to-b from-yellow-500/15 to-yellow-600/5 border border-yellow-500/20' : 'bg-gradient-to-b from-yellow-50 to-amber-50 border border-yellow-200'}`}>
                        <div className="flex items-center justify-between w-full mb-3">
                            <span className="text-base">🍞</span>
                            <span className="text-[10px] font-bold text-yellow-500">{Math.round((totals.carb / macroGoals.carb) * 100)}%</span>
                        </div>
                        <div className="relative w-16 h-16 mb-3">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme === 'dark' ? '#2a2a2e' : '#E5E7EB'} strokeWidth="2.5" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray={`${Math.min(Math.round((totals.carb / macroGoals.carb) * 100), 100)}, 100`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-lg font-black ${theme === 'dark' ? 'text-yellow-50' : 'text-yellow-900'}`}>{Math.round(totals.carb)}<span className="text-xs font-bold opacity-50">g</span></span>
                            </div>
                        </div>
                        <p className={`text-[10px] font-medium ${styles.textSec}`}>{Math.max(0, Math.round(macroGoals.carb - totals.carb))}g left</p>
                    </div>

                    {/* Protein */}
                    <div className={`rounded-2xl p-4 flex flex-col items-center ${theme === 'dark' ? 'bg-gradient-to-b from-blue-500/15 to-blue-600/5 border border-blue-500/20' : 'bg-gradient-to-b from-blue-50 to-indigo-50 border border-blue-200'}`}>
                        <div className="flex items-center justify-between w-full mb-3">
                            <span className="text-base">💪</span>
                            <span className="text-[10px] font-bold text-blue-500">{Math.round((totals.pro / macroGoals.pro) * 100)}%</span>
                        </div>
                        <div className="relative w-16 h-16 mb-3">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme === 'dark' ? '#2a2a2e' : '#E5E7EB'} strokeWidth="2.5" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray={`${Math.min(Math.round((totals.pro / macroGoals.pro) * 100), 100)}, 100`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-lg font-black ${theme === 'dark' ? 'text-blue-50' : 'text-blue-900'}`}>{Math.round(totals.pro)}<span className="text-xs font-bold opacity-50">g</span></span>
                            </div>
                        </div>
                        <p className={`text-[10px] font-medium ${styles.textSec}`}>{Math.max(0, Math.round(macroGoals.pro - totals.pro))}g left</p>
                    </div>

                    {/* Fat */}
                    <div className={`rounded-2xl p-4 flex flex-col items-center ${theme === 'dark' ? 'bg-gradient-to-b from-red-500/15 to-red-600/5 border border-red-500/20' : 'bg-gradient-to-b from-red-50 to-pink-50 border border-red-200'}`}>
                        <div className="flex items-center justify-between w-full mb-3">
                            <span className="text-base">🥑</span>
                            <span className="text-[10px] font-bold text-red-500">{Math.round((totals.fat / macroGoals.fat) * 100)}%</span>
                        </div>
                        <div className="relative w-16 h-16 mb-3">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme === 'dark' ? '#2a2a2e' : '#E5E7EB'} strokeWidth="2.5" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeDasharray={`${Math.min(Math.round((totals.fat / macroGoals.fat) * 100), 100)}, 100`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.4))' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-lg font-black ${theme === 'dark' ? 'text-red-50' : 'text-red-900'}`}>{Math.round(totals.fat)}<span className="text-xs font-bold opacity-50">g</span></span>
                            </div>
                        </div>
                        <p className={`text-[10px] font-medium ${styles.textSec}`}>{Math.max(0, Math.round(macroGoals.fat - totals.fat))}g left</p>
                    </div>
                </div>
            </div>

            {/* Diary Preview Header */}
            <div className="pt-6 flex justify-between items-center px-1 mb-4">
                <h3 className={`label-text ${styles.textMain}`}>Daily Diary</h3>
                <span className="caption-text">Scroll for meals</span>
            </div>
            
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 -mx-6 px-6 pb-6 no-scrollbar">
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
                    const mealCals = logs[meal].reduce((acc, i) => acc + i.calories, 0);
                    const mealStats = logs[meal].reduce((acc, item) => ({
                        pro: acc.pro + (item.protein || 0),
                        carb: acc.carb + (item.carbs || 0),
                        fat: acc.fat + (item.fat || 0),
                    }), { pro: 0, carb: 0, fat: 0 });
                    const totalGrams = mealStats.pro + mealStats.carb + mealStats.fat || 1;
                    const pPct = (mealStats.pro / totalGrams) * 100;
                    const cPct = (mealStats.carb / totalGrams) * 100;
                    const fPct = (mealStats.fat / totalGrams) * 100;
                    const isSelectionMode = selectionState.meal === meal;

                    return (
                        <div key={meal} id={`meal-section-${meal}`} className="snap-center min-w-[88vw] md:min-w-[340px]">
                            <div className={`rounded-[2.5rem] p-6 border relative overflow-hidden transition-all shadow-xl shadow-black/5 ${styles.card} ${styles.border}`}>
                                {/* Meal Header */}
                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h3 className={`text-xl font-extrabold tracking-tight ${styles.textMain}`}>{meal}</h3>
                                    <div className={`px-3 py-1.5 rounded-full font-bold text-sm ${theme === 'dark' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                        {mealCals} <span className="text-[10px] opacity-70">kcal</span>
                                    </div>
                                </div>

                                {/* Macro Bars */}
                                {mealCals > 0 && (
                                    <div className={`mb-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className={`text-[10px] font-bold ${styles.textSec}`}>Protein</span>
                                                </div>
                                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(pPct, 100)}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.pro)}g</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span className={`text-[10px] font-bold ${styles.textSec}`}>Carbs</span>
                                                </div>
                                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(cPct, 100)}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.carb)}g</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                    <span className={`text-[10px] font-bold ${styles.textSec}`}>Fat</span>
                                                </div>
                                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(fPct, 100)}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.fat)}g</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                {mealCals > 0 && <div className={`h-px mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`} />}

                                {/* Food Items */}
                                <div className="space-y-2">
                                    {logs[meal].length > 0 ? (
                                        logs[meal].map((food) => (
                                            <FoodItem key={food.uid} food={food} theme={theme} onClick={onFoodClick} />
                                        ))
                                    ) : (
                                        <div className={`flex flex-col items-center justify-center h-28 gap-2 border-2 border-dashed rounded-2xl ${theme === 'dark' ? 'border-white/5' : 'border-gray-200/50'}`}>
                                            <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                <Plus size={18} className={`opacity-40 ${styles.textSec}`} />
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

            {/* --- FITNESS HUB --- */}
            <div className={`rounded-[2.5rem] p-6 border relative overflow-hidden ${styles.card} ${styles.border}`}>
                {/* Page Header */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-lg">⚡</span>
                            <h3 className={`text-xl font-extrabold tracking-tight ${styles.textMain}`}>Fitness Hub</h3>
                        </div>
                        <p className={`text-[11px] font-medium ${styles.textSec}`}>Track your burn & stats</p>
                    </div>
                    <button
                        onClick={onAddExercise}
                        className="px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-red-500/20 active:scale-95 bg-red-600 text-white hover:bg-red-500"
                    >
                        <Plus size={14} strokeWidth={3} /> LOG ACTIVITY
                    </button>
                </div>

                {/* Burn Banner */}
                <div className={`mb-6 p-5 rounded-[2rem] flex items-center justify-between relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-100'}`}>
                    <div className="relative z-10">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Total Burned Today</p>
                        <h4 className={`text-3xl font-black ${styles.textMain}`}>
                            {burned} <span className="text-base font-bold opacity-60">kcal</span>
                        </h4>
                        <div className="flex gap-4 mt-2">
                            <span className={`text-[10px] font-bold ${styles.textSec}`}><strong className={styles.textMain}>{dayActivities.length}</strong> activity</span>
                            <span className={`text-[10px] font-bold ${styles.textSec}`}><strong className={styles.textMain}>{burnMetrics.workoutMinutes || 0}</strong> min active</span>
                            {dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0) > 0 && (
                                <span className={`text-[10px] font-bold ${styles.textSec}`}><strong className={styles.textMain}>{dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0).toFixed(1)}</strong> km</span>
                            )}
                        </div>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${theme === 'dark' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-200'}`}>
                        🔥
                    </div>
                </div>

                {/* Activities Section */}
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${styles.textSec}`}>Today's Activities</h4>
                {dayActivities.length > 0 ? (
                    <div className="space-y-3">
                        {dayActivities.map((item) => {
                            const emoji = emojiMap[item.activityType] || '⚡';
                            const isGPS = item.type === 'gps';
                            const burnGoal = Math.round(goal * 0.3);
                            const goalPct = burnGoal > 0 ? Math.min(Math.round((burned / burnGoal) * 100), 100) : 0;
                            const pace = item.distance > 0 && item.duration > 0 ? (item.distance / (item.duration / 60)).toFixed(1) : '--';
                            const stepsPerMin = item.steps > 0 && item.duration > 0 ? Math.round(item.steps / (item.duration / 60)) : '--';

                            return (
                                <div key={item.id} className={`rounded-2xl p-4 border transition-all ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    {/* Card Top */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${theme === 'dark' ? 'bg-red-500/15' : 'bg-red-50'}`}>
                                            {emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-base font-bold capitalize ${styles.textMain}`}>{item.activityType}</div>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {item.distance > 0 && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                                        📍 {item.distance} km
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                                    ⏱ {displayDuration(item)}
                                                </span>
                                                {item.steps > 0 && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                                        👟 ~{Math.round(item.steps).toLocaleString()} steps
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-lg font-black ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>−{item.caloriesBurned}</div>
                                            <div className={`text-[9px] font-bold uppercase ${styles.textSec}`}>kcal burned</div>
                                            <div className={`text-[9px] font-bold mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {isGPS ? '📍 GPS' : '✏ Manual'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress vs daily burn goal */}
                                    <div className={`mb-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                            <span className={styles.textSec}>Daily burn goal</span>
                                            <span className={styles.textSec}>{burned} / {burnGoal} kcal</span>
                                        </div>
                                        <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                            <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${goalPct}%` }} />
                                        </div>
                                    </div>

                                    {/* Stat Chips */}
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                            <div className={`text-sm font-black ${styles.textMain}`}>{pace}</div>
                                            <div className={`text-[9px] font-bold ${styles.textSec}`}>km/h pace</div>
                                        </div>
                                        <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                            <div className={`text-sm font-black ${styles.textMain}`}>{Math.round((item.duration || 0) / 60)}</div>
                                            <div className={`text-[9px] font-bold ${styles.textSec}`}>min</div>
                                        </div>
                                        <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                            <div className={`text-sm font-black ${styles.textMain}`}>{stepsPerMin}</div>
                                            <div className={`text-[9px] font-bold ${styles.textSec}`}>steps/min</div>
                                        </div>
                                        <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                            <div className={`text-sm font-black ${styles.textMain}`}>{goalPct}%</div>
                                            <div className={`text-[9px] font-bold ${styles.textSec}`}>goal hit</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`text-center py-10 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                        <div className={`text-4xl mb-2 ${styles.textSec}`}>＋</div>
                        <p className={`text-sm font-medium ${styles.textSec}`}>Log another activity to keep the streak going</p>
                        <button onClick={onAddExercise} className="text-xs font-bold text-blue-500 mt-2 hover:underline">Log your first activity</button>
                    </div>
                )}
            </div>

            <WaterInputModal 
                isOpen={showWaterModal} 
                onClose={() => setShowWaterModal(false)} 
                currentGlasses={waterIntake} 
                onAdd={updateWater} 
                theme={theme} 
            />
        </div>
    );
};

export default DashboardPage;
