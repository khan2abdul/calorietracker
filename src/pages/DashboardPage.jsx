import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Activity, Sun, Moon, TreeDeciduous, Utensils, Edit2, Minus, Plus, Flame, Trash2, TrendingDown, CheckSquare,
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

const DashboardPage = ({
    logs, userStats, totals, goal, waterIntake,
    theme, toggleTheme, updateWater, onAddClick, onAddExercise,
    onEditFood, onDeleteFood, onFoodClick, onDeleteBatch,
    selectionState, toggleSelectionMode, toggleItemSelection,
    onGenerateInsight, currentDate, setCurrentDate,
    onEditExercise, onDeleteExercise, onRingClick, totalBurned
}) => {
    const burned = totalBurned || 0; 
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
    const [swipedExerciseId, setSwipedExerciseId] = useState(null);

    // Touch handlers for swipe
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const onTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
        touchEnd.current = null;
    };

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = (id) => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) setSwipedExerciseId(id);
        if (isRightSwipe) setSwipedExerciseId(null);
    };

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

            {/* Block 2: Stats Bar */}
            <div className={`rounded-[2rem] h-[64px] grid grid-cols-3 items-center text-center shadow-lg relative overflow-hidden ${styles.card} ${styles.border}`}>
                <div className="flex flex-col items-center w-full">
                    <span className="caption-text">Eaten</span>
                    <span className={`text-[22px] font-[800] leading-tight ${styles.textMain}`}>{totals.cals}</span>
                </div>
                
                <div className={`absolute left-[33.33%] top-4 bottom-4 w-[1px] ${styles.border} opacity-50`}></div>
                
                <div className="flex flex-col items-center w-full">
                    <span className="caption-text">Burned</span>
                    <div className="flex flex-col leading-tight">
                        <span className={`text-[22px] font-[800] ${styles.textMain}`}>{totalBurned}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${netCalChange <= 0 ? 'text-[#34C759]' : 'text-orange-400'}`}>
                            {netCalChange <= 0 ? 'Under goal ✓' : `+${netCalChange} over`}
                        </span>
                    </div>
                </div>
                
                <div className={`absolute left-[66.66%] top-4 bottom-4 w-[1px] ${styles.border} opacity-50`}></div>

                <div className="flex flex-col items-center w-full relative">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="caption-text">Water</span>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                const val = prompt("Enter water intake in glasses (1 glass = 250ml):", Math.round(waterIntake));
                                if (val !== null) {
                                    const num = Number(val);
                                    if (!isNaN(num)) updateWater(num - waterIntake);
                                }
                            }} 
                            className="text-[#888] hover:text-white transition-colors"
                        >
                            <Edit2 size={10} />
                        </button>
                    </div>
                    <div className="flex items-baseline gap-1 leading-tight mb-1">
                        <span className="text-[22px] font-[800] text-white">
                            {(waterConsumed / 1000).toFixed(1)}
                        </span>
                        <span className="text-[11px] font-medium text-[#888]">/ 3.0 L</span>
                    </div>
                    
                    {/* Water Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#121212]">
                        <div 
                            className={`h-full transition-all duration-1000 ${waterConsumed >= 3000 ? 'bg-[#34C759]' : 'bg-[#0A84FF]'}`} 
                            style={{ width: `${Math.min((waterConsumed / 3000) * 100, 100)}%` }}
                        />
                    </div>
                    {waterConsumed >= 3000 && (
                        <div className="absolute top-0 right-2 flex items-center justify-center">
                             <span className="text-[9px] font-bold text-[#34C759] uppercase tracking-tighter">✓ Goal</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Block 3: Macros Card */}
            <div className={`rounded-[2rem] p-[20px] shadow-lg ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-[1.5px]">Macros</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 min-w-0"><MacroMiniCard label="Carbs" value={totals.carb} max={250} color="#F5C542" icon="🍞" /></div>
                    <div className="flex-1 min-w-0"><MacroMiniCard label="Protein" value={totals.pro} min={0} max={180} color="#4A90D9" icon="🍗" /></div>
                    <div className="flex-1 min-w-0"><MacroMiniCard label="Fat" value={totals.fat} max={80} color="#E0607E" icon="🥑" /></div>
                </div>
            </div>

            {/* Block 4: Meals Row */}
            <div className={`rounded-[2rem] p-[20px] shadow-lg ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-center mb-3 px-1">
                    <span className="caption-text">Meals</span>
                </div>
                <MealChips logs={logs} theme={theme} onMealClick={scrollToMeal} />
            </div>

            {/* Diary Preview Header */}
            <div className="pt-6 flex justify-between items-center px-1 mb-4">
                <h3 className={`label-text ${styles.textMain}`}>Daily Diary</h3>
                <span className="caption-text">Scroll for meals</span>
            </div>
            
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 -mx-6 px-6 pb-6 no-scrollbar">
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
                    const mealCals = logs[meal].reduce((acc, i) => acc + i.calories, 0);
                    const isSelectionMode = selectionState.meal === meal;
                    return (
                        <div key={meal} id={`meal-section-${meal}`} className="snap-center min-w-[88vw] md:min-w-[340px]">
                            <div className={`rounded-[3rem] p-7 h-full border relative overflow-hidden transition-all shadow-xl shadow-black/5 ${styles.card} ${styles.border}`}>
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
                                        <button 
                                            onClick={() => onAddClick(meal)}
                                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}
                                        >
                                            <Plus size={16} />
                                        </button>
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
                            {burned}
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
            </div>
        </div>
    );
};

export default DashboardPage;
