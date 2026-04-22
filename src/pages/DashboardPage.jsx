import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Sun, Moon, TreeDeciduous, Utensils, Plus, TrendingUp,
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
    Bell, Flame, Droplets
} from 'lucide-react';
import { auth, db } from '../firebase';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { THEMES } from '../theme';
import { FoodItem } from '../components/Dashboard/FoodItem';
import WaterInputModal from '../components/WaterInputModal';
import { ACTIVITY_EMOJI, calculateMacroGoals, DEFAULT_CALORIE_DEFICIT, KCAL_PER_KG } from '../config';

/* ─── Helpers ─── */

function useCountUp(end, duration = 1500) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [end, duration]);
    return count;
}

const MEAL_EMOJIS = { Breakfast: '🌅', Lunch: '🍲', Dinner: '🌙', Snacks: '🍎' };

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
    const [expandedMeals, setExpandedMeals] = useState({
        Breakfast: false,
        Lunch: false,
        Dinner: false,
        Snacks: false
    });

    /* ─── Theme-aware colors ─── */
    const isDark = theme === 'dark';
    const isWooden = theme === 'wooden';
    const styles = THEMES[theme] || THEMES.dark;

    const tc = useMemo(() => {
        if (theme === 'dark') {
            return {
                bg: '#0a0a0a',
                headerBg: 'rgba(10,10,10,0.7)',
                cardBg: 'rgba(255,255,255,0.03)',
                cardBgSolid: '#111111',
                pillBg: 'rgba(255,255,255,0.05)',
                border: 'rgba(255,255,255,0.06)',
                borderLight: 'rgba(255,255,255,0.03)',
                textMain: '#ffffff',
                textSec: 'rgba(255,255,255,0.4)',
                textMuted: 'rgba(255,255,255,0.25)',
                textFaint: 'rgba(255,255,255,0.3)',
                ringTrack: 'rgba(255,255,255,0.04)',
                barTrack: 'rgba(255,255,255,0.06)',
                iconColor: 'text-white/40',
                iconHover: 'text-white/70',
            };
        }
        if (theme === 'wooden') {
            return {
                bg: '#C19A6B',
                headerBg: 'rgba(193,154,107,0.85)',
                cardBg: 'rgba(234,221,202,0.95)',
                cardBgSolid: '#EADDCA',
                pillBg: 'rgba(62,39,35,0.06)',
                border: 'rgba(62,39,35,0.15)',
                borderLight: 'rgba(62,39,35,0.08)',
                textMain: '#3E2723',
                textSec: 'rgba(62,39,35,0.6)',
                textMuted: 'rgba(62,39,35,0.4)',
                textFaint: 'rgba(62,39,35,0.35)',
                ringTrack: 'rgba(62,39,35,0.1)',
                barTrack: 'rgba(62,39,35,0.12)',
                iconColor: 'text-[#3E2723]/40',
                iconHover: 'text-[#3E2723]/70',
            };
        }
        // light
        return {
            bg: '#F2F2F7',
            headerBg: 'rgba(242,242,247,0.85)',
            cardBg: '#ffffff',
            cardBgSolid: '#ffffff',
            pillBg: 'rgba(0,0,0,0.03)',
            border: 'rgba(0,0,0,0.08)',
            borderLight: 'rgba(0,0,0,0.04)',
            textMain: '#0f172a',
            textSec: 'rgba(0,0,0,0.5)',
            textMuted: 'rgba(0,0,0,0.35)',
            textFaint: 'rgba(0,0,0,0.3)',
            ringTrack: 'rgba(0,0,0,0.06)',
            barTrack: 'rgba(0,0,0,0.08)',
            iconColor: 'text-slate-900/40',
            iconHover: 'text-slate-900/70',
        };
    }, [theme]);

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

    const estimateDate = useMemo(() => {
        if (!userStats.targetWeight || !userStats.weight || !userStats.startDate) return null;
        if (Math.abs(userStats.weight - userStats.targetWeight) < 0.1) return "Achieved!";
        
        const remaining = userStats.targetWeight - userStats.weight;
        const weeksActive = Math.max(0.1, (Date.now() - new Date(userStats.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const kgChanged = userStats.weight - (userStats.initialWeight || userStats.weight);
        const weeklyVelocity = kgChanged / weeksActive;

        let days;
        if (userStats.targetDays === 'Auto') {
            if (Math.abs(weeklyVelocity) > 0.05) {
                const weeksToGoal = remaining / weeklyVelocity;
                days = Math.round(weeksToGoal * 7);
            } else {
                const diff = Math.abs(remaining);
                const deficit = (goal - totals.cals) + totalBurned;
                const projectedDailyDeficit = deficit > 100 ? deficit : DEFAULT_CALORIE_DEFICIT;
                days = Math.ceil((diff * KCAL_PER_KG) / projectedDailyDeficit);
            }
            days = Math.min(Math.max(days, 7), 365);
        } else {
            days = userStats.targetDays || 90;
        }

        const goalDate = new Date();
        goalDate.setDate(goalDate.getDate() + days);
        return goalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [userStats, totals.cals, totalBurned, goal]);

    const parsedEstimate = useMemo(() => {
        if (!estimateDate || estimateDate === 'Achieved!') return null;
        const parts = estimateDate.split(',');
        if (parts.length >= 2) {
            const monthDay = parts[0].trim();
            const year = parts[1].trim();
            return { monthDay, year };
        }
        const p = estimateDate.split(' ');
        if (p.length >= 3) {
            return { monthDay: `${p[0]} ${p[1]}`, year: p[2] };
        }
        return { monthDay: estimateDate, year: '' };
    }, [estimateDate]);

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good morning";
        if (hours < 17) return "Good afternoon";
        return "Good evening";
    };

    const userName = auth.currentUser?.displayName?.split(' ')[0] || "there";
    const emojiMap = ACTIVITY_EMOJI;

    const waterGoal = 3000; 
    const waterConsumed = waterIntake * 250;

    const macroGoals = useMemo(() => calculateMacroGoals(goal), [goal]);

    const changeDate = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
    };

    const isToday = new Date().toDateString() === currentDate.toDateString();

    /* ─── Sub-components with theme awareness ─── */
    const StatCard = ({ icon, label, value, unit, color, onClick }) => (
        <button onClick={onClick} className="relative overflow-hidden rounded-2xl p-3.5 flex flex-col items-start gap-2 text-left transition-all active:scale-95" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.border}` }}>
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${color}`} />
            <div style={{ color: tc.textFaint }}>{icon}</div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: tc.textMuted }}>{label}</p>
                <p className="text-lg font-black leading-tight" style={{ color: tc.textMain }}>{value}<span className="text-[10px] font-bold ml-0.5" style={{ color: tc.textMuted }}>{unit}</span></p>
            </div>
        </button>
    );

    const CalorieRing = ({ consumed, goal }) => {
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const percentConsumed = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
        const remainingCals = Math.max(0, goal - consumed);
        const animatedRemaining = useCountUp(remainingCals, 1500);

        return (
            <div className="relative flex flex-col items-center py-3">
                <div className="relative w-[220px] h-[220px]" style={{ filter: 'drop-shadow(0 0 24px rgba(45,212,191,0.25))' }}>
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                        <defs>
                            <linearGradient id="ringTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#2dd4bf" />
                                <stop offset="100%" stopColor="#14b8a6" />
                            </linearGradient>
                        </defs>
                        <circle cx="110" cy="110" r={radius} fill="none" stroke={tc.ringTrack} strokeWidth="16" strokeLinecap="round" />
                        <motion.circle
                            cx="110" cy="110" r={radius}
                            fill="none"
                            stroke="url(#ringTeal)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference * (1 - percentConsumed / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className="text-[44px] font-black leading-none tracking-tighter"
                            style={{ color: tc.textMain }}
                            animate={{ fontWeight: [700, 900, 700] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {animatedRemaining}
                        </motion.span>
                        <span className="text-[10px] font-bold mt-1 uppercase tracking-[0.15em]" style={{ color: tc.textFaint }}>Remaining</span>
                        <span className="text-[11px] font-bold text-teal-400 mt-1.5">{Math.round(percentConsumed)}% consumed</span>
                    </div>
                </div>
                <p className="text-[13px] font-medium mt-4" style={{ color: tc.textFaint }}>
                    {Math.round(consumed)} / {Math.round(goal)} kcal goal
                </p>
            </div>
        );
    };

    return (
        <div className={`flex flex-col pb-32 animate-fade-in relative ${styles.bg}`} style={{ maxWidth: '430px', margin: '0 auto' }}>
            {/* Noise texture overlay */}
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '128px 128px',
                maxWidth: '430px',
                margin: '0 auto',
                left: '0',
                right: '0'
            }} />

            <div className="px-5 pt-5 pb-2 relative z-10 space-y-5">
                {/* Date Navigator + Theme Toggle */}
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => changeDate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:opacity-80 active:scale-90" style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.border}` }}>
                        <ChevronLeft size={16} style={{ color: tc.textMain, opacity: 0.4 }} />
                    </button>
                    <motion.div
                        key={currentDate.toDateString()}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="min-w-[150px] text-center px-5 py-2.5 rounded-2xl"
                        style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.border}` }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: tc.textSec }}>{isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-[13px] font-black mt-0.5" style={{ color: tc.textMain }}>
                            {isToday ? new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase() : currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                        </p>
                    </motion.div>
                    <button onClick={() => changeDate(1)} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:opacity-80 active:scale-90" style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.border}` }}>
                        <ChevronRight size={16} style={{ color: tc.textMain, opacity: 0.4 }} />
                    </button>
                    <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80 active:scale-90" style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.border}` }}>
                        {theme === 'light' ? <Sun size={15} style={{ color: tc.textMain, opacity: 0.6 }} /> : (theme === 'dark' ? <Moon size={15} style={{ color: tc.textMain, opacity: 0.6 }} /> : <TreeDeciduous size={15} style={{ color: tc.textMain, opacity: 0.6 }} />)}
                    </button>
                </div>

                {/* Greeting Block */}
                <div className="text-center -mt-1">
                    <h1 className="text-[26px] font-black leading-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                        {getGreeting()}, {userName}
                    </h1>
                </div>

                {/* Goal Card */}
                {userStats.targetWeight && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl backdrop-blur-md p-4"
                        whileTap={{ scale: 0.98 }}
                        style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.border}` }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: tc.textMuted }}>Estimated Goal Date</p>
                                    <p className="text-[15px] font-black mt-0.5" style={{ color: tc.textMain }}>Reach <span className="text-emerald-400">{userStats.targetWeight}kg</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                {parsedEstimate ? (
                                    <>
                                        <p className="text-[18px] font-black leading-none" style={{ color: tc.textMain }}>{parsedEstimate.monthDay}</p>
                                        <p className="text-[11px] font-bold mt-0.5" style={{ color: tc.textFaint }}>{parsedEstimate.year}</p>
                                    </>
                                ) : (
                                    <p className="text-[18px] font-black" style={{ color: tc.textFaint }}>--</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Circular Progress Ring */}
                <CalorieRing
                    consumed={totals.cals}
                    goal={goal}
                />

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={<Utensils size={16} />} label="Eaten" value={String(Math.round(totals.cals))} unit="kcal" color="bg-emerald-500" />
                    <StatCard icon={<Flame size={16} />} label="Burned" value={String(Math.round(totalBurned))} unit="kcal" color="bg-orange-500" />
                    <StatCard icon={<Droplets size={16} />} label="Water" value={String((waterConsumed / 1000).toFixed(1))} unit="L" color="bg-blue-500" onClick={() => setShowWaterModal(true)} />
                </div>

                {/* Daily Macros Summary */}
                <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.border}` }}>
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: tc.textMuted }}>Daily Macros</p>
                        <p className="text-[10px] font-bold" style={{ color: tc.textFaint }}>{Math.round(totals.pro + totals.carb + totals.fat)}g total</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Protein', val: totals.pro, goal: macroGoals.pro, color: 'bg-blue-500', text: 'text-blue-400' },
                            { label: 'Carbs', val: totals.carb, goal: macroGoals.carb, color: 'bg-emerald-500', text: 'text-emerald-400' },
                            { label: 'Fat', val: totals.fat, goal: macroGoals.fat, color: 'bg-orange-500', text: 'text-orange-400' },
                        ].map(m => {
                            const pct = m.goal > 0 ? Math.min((m.val / m.goal) * 100, 100) : 0;
                            return (
                                <div key={m.label} className="flex flex-col items-center gap-1.5 p-2 rounded-xl" style={{ backgroundColor: tc.pillBg }}>
                                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tc.textMuted }}>{m.label}</span>
                                    <span className={`text-sm font-black ${m.text}`}>{Math.round(m.val)}g</span>
                                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: tc.barTrack }}>
                                        <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[9px] font-bold" style={{ color: tc.textFaint }}>{Math.round(pct)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Diary Section */}
            <div className="px-5 pt-2 space-y-3">
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
                    const mealCals = logs[meal].reduce((acc, i) => acc + i.calories, 0);
                    const mealStats = logs[meal].reduce((acc, item) => ({
                        pro: acc.pro + (item.protein || 0),
                        carb: acc.carb + (item.carbs || 0),
                        fat: acc.fat + (item.fat || 0),
                    }), { pro: 0, carb: 0, fat: 0 });
                    
                    const isExpanded = expandedMeals[meal];
                    const mealPct = goal > 0 ? Math.round((mealCals / goal) * 100) : 0;

                    const pGoalPct = macroGoals.pro > 0 ? Math.min((mealStats.pro / macroGoals.pro) * 100, 100) : 0;
                    const cGoalPct = macroGoals.carb > 0 ? Math.min((mealStats.carb / macroGoals.carb) * 100, 100) : 0;
                    const fGoalPct = macroGoals.fat > 0 ? Math.min((mealStats.fat / macroGoals.fat) * 100, 100) : 0;

                    return (
                        <div key={meal} className="rounded-[1.25rem] overflow-hidden transition-all" style={{ backgroundColor: tc.cardBgSolid, border: `1px solid ${tc.border}` }}>
                            {/* Meal Header */}
                            <div 
                                className="p-4 flex justify-between items-center cursor-pointer active:scale-[0.995] transition-transform"
                                onClick={() => setExpandedMeals(prev => ({ ...prev, [meal]: !prev[meal] }))}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: tc.pillBg }}>
                                        {MEAL_EMOJIS[meal]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[15px] font-bold" style={{ color: tc.textMain }}>{meal}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-emerald-400">{Math.round(mealCals)} kcal</span>
                                            <span className="text-[11px] font-medium" style={{ color: tc.textMuted }}>· {mealPct}% of daily goal</span>
                                        </div>
                                        {/* Macro bars */}
                                        <div className="mt-2.5 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                                <span className="text-[10px] font-bold w-11 shrink-0" style={{ color: tc.textSec }}>Protein</span>
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: tc.barTrack }}>
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pGoalPct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold w-7 text-right shrink-0" style={{ color: tc.textFaint }}>{Math.round(mealStats.pro)}g</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="text-[10px] font-bold w-11 shrink-0" style={{ color: tc.textSec }}>Carbs</span>
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: tc.barTrack }}>
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cGoalPct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold w-7 text-right shrink-0" style={{ color: tc.textFaint }}>{Math.round(mealStats.carb)}g</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                                <span className="text-[10px] font-bold w-11 shrink-0" style={{ color: tc.textSec }}>Fat</span>
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: tc.barTrack }}>
                                                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${fGoalPct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold w-7 text-right shrink-0" style={{ color: tc.textFaint }}>{Math.round(mealStats.fat)}g</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-3 shrink-0">
                                    {isExpanded ? <ChevronUp size={18} style={{ color: tc.textFaint }} /> : <ChevronDown size={18} style={{ color: tc.textFaint }} />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 animate-fade-in pt-3" style={{ borderTop: `1px solid ${tc.borderLight}` }} onClick={(e) => e.stopPropagation()}>
                                    <div className="space-y-2.5">
                                        {logs[meal].length > 0 ? (
                                            logs[meal].map((food) => (
                                                <FoodItem key={food.uid} food={food} theme={theme} onClick={onFoodClick} />
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-24 gap-2 border-2 border-dashed rounded-2xl cursor-pointer hover:opacity-80 active:scale-95 transition" style={{ borderColor: tc.border, backgroundColor: tc.pillBg }} onClick={() => onAddClick(meal, 'food')}>
                                                <div className="p-2 rounded-full" style={{ backgroundColor: tc.pillBg }}>
                                                    <Plus size={18} style={{ color: tc.textMain, opacity: 0.3 }} />
                                                </div>
                                                <span className="text-xs font-bold" style={{ color: tc.textSec }}>Tap to log {meal}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- FITNESS HUB --- */}
            <div className={`mt-6 mx-5 rounded-[2rem] p-5 border relative overflow-hidden ${styles.card} ${styles.border}`}>
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
                        <Plus size={14} strokeWidth={3} /> LOG
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
                            <span className={`text-[10px] font-bold ${styles.textSec}`}><strong className={styles.textMain}>{burnMetrics.workoutMinutes || 0}</strong> min</span>
                            {dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0) > 0 && (
                                <span className={`text-[10px] font-bold ${styles.textSec}`}><strong className={styles.textMain}>{dayActivities.reduce((sum, a) => sum + (a.distance || 0), 0).toFixed(1)}</strong> km</span>
                            )}
                        </div>
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${theme === 'dark' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-200'}`}>
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
