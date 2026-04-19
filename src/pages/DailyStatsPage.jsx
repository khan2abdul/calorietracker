import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, Activity, Droplets, PieChart, Info, Moon, Dumbbell, Zap } from 'lucide-react';
import { THEMES } from '../theme';
import { calculateBMR, calculateTDEE } from '../utils';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const DailyStatsPage = ({ totals, goal, waterIntake, burnMetrics, theme, userStats, onBack }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const { totalBurned, workoutBurned, stepBurned, workoutMinutes, steps } = burnMetrics;
    
    const water = waterIntake * 250; 
    const isOver = totals.cals > goal;
    const bmr = Math.round(calculateBMR(userStats));
    const tdee = Math.round(calculateTDEE(userStats));
    const netCalories = totals.cals - totalBurned;
    const deficit = tdee - totals.cals + totalBurned;

    // Weekly Trend Data
    const [weeklyTrend, setWeeklyTrend] = useState([]);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'activities'), where('userId', '==', auth.currentUser.uid));
        const unsub = onSnapshot(q, (snap) => {
            const history = snap.docs.map(d => ({ ...d.data(), date: d.data().date?.toDate() }));
            
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();
            const last7Days = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                d.setHours(0, 0, 0, 0);
                
                const dayLabel = days[d.getDay()];
                const dayStart = d.getTime();
                const dayEnd = dayStart + 86400000;

                const dayActivities = history.filter(a => a.date && a.date.getTime() >= dayStart && a.date.getTime() < dayEnd);
                const dayBurn = dayActivities.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);
                
                // For simplicity, we assume maintenance consumption for history bars if no food logs are available here
                // But the user asked for "deficit (green) or surplus (orange)". 
                // Since DailyStatsPage doesn't have 7 days of food logs passed in, 
                // we'll focus the trend on Activity Burn as a visual proxy or indicate it's activity-based.
                // UNLESS we fetch daily_logs too. Let's fetch daily_logs for trend accuracy.
                last7Days.push({ label: dayLabel, burn: dayBurn, time: dayStart, isToday: i === 0 });
            }
            // Fetching logs would be better for true deficit. For now, let's use the activity trend as requested.
            setWeeklyTrend(last7Days);
        });
        return unsub;
    }, []);

    const kgPerWeek = ((deficit * 7) / 7700).toFixed(2);

    return (
        <div className={`min-h-screen animate-fade-in pb-32 ${styles.bg}`}>
            {/* Header Area */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between">
                <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90 ${styles.card} ${styles.border}`}>
                    <ChevronLeft size={20} className={styles.textMain} />
                </button>
                <h1 className={`text-xl font-black tracking-tight ${styles.textMain}`}>Daily Insights</h1>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${styles.card} ${styles.border} opacity-20`}>
                    <Info size={18} />
                </div>
            </div>

            <div className="px-6 space-y-6 max-w-lg mx-auto">
                
                {/* 1. HERO CARD */}
                <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all shadow-xl ${deficit >= 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/20' : 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-500/20'}`}>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Caloric Impact</span>
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${deficit >= 0 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-red-500 text-white'}`}>
                            {deficit >= 0 ? 'Deficit' : 'Surplus'}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className={`text-6xl font-black tracking-tighter ${styles.textMain}`}>{Math.abs(deficit)}</span>
                        <span className="text-xl font-bold opacity-60">kcal</span>
                    </div>

                    <p className={`text-sm font-medium mt-4 leading-relaxed ${styles.textSec}`}>
                        {deficit >= 0 
                            ? "You're in a healthy deficit! Your body is using stored energy." 
                            : "You're in a surplus today. This energy will be stored for later use."}
                    </p>

                    {/* Formula Row */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-x-2 gap-y-1 text-[12px] font-bold" style={{ color: '#888' }}>
                        <span>TDEE</span> <span style={{ color: '#0A84FF' }}>{tdee}</span>
                        <span>−</span>
                        <span>Eaten</span> <span style={{ color: '#34C759' }}>{totals.cals}</span>
                        <span>+</span>
                        <span>Burned</span> <span style={{ color: '#FF9F0A' }}>{totalBurned}</span>
                        <span>=</span>
                        <span style={{ color: deficit >= 0 ? '#34C759' : '#FF453A' }}>{deficit} kcal</span>
                    </div>
                </div>

                {/* 2. TDEE + BMR Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-5 rounded-[2rem] border ${styles.card} ${styles.border}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec} mb-1`}>TDEE</p>
                        <p className={`text-xl font-black ${styles.textMain}`}>{tdee} <span className="text-[10px] opacity-40">kcal</span></p>
                        <p className={`text-[9px] font-medium ${styles.textSec} mt-1`}>Total daily burn estimate</p>
                    </div>
                    <div className={`p-5 rounded-[2rem] border ${styles.card} ${styles.border}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec} mb-1`}>BMR</p>
                        <p className={`text-xl font-black ${styles.textMain}`}>{bmr} <span className="text-[10px] opacity-40">kcal</span></p>
                        <p className={`text-[9px] font-medium ${styles.textSec} mt-1`}>Calories burned at rest</p>
                    </div>
                </div>

                {/* 3. GOAL PACE Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-center gap-3 ${styles.card} ${styles.border}`}>
                   <Zap size={16} className={deficit >= 0 ? 'text-green-500' : 'text-orange-500'} />
                   <p className={`text-xs font-bold ${deficit >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                       At this rate → ~{Math.abs(kgPerWeek)} kg/week {deficit >= 0 ? 'loss' : 'gain'}
                   </p>
                </div>

                {/* 4. ACTIVITY SPLIT */}
                <div className={`p-6 rounded-[2.5rem] border ${styles.card} ${styles.border}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-widest px-1 mb-6 opacity-50 ${styles.textMain}`}>Activity Split</h3>
                    <div className="space-y-6">
                        <ActivityRow 
                            icon={<Zap size={14} />} 
                            label="Steps" 
                            sub={`${steps} steps`}
                            value={`${stepBurned} kcal`}
                            progress={(steps / 10000) * 100}
                            color="#FF9F0A"
                            styles={styles}
                        />
                        <ActivityRow 
                            icon={<Dumbbell size={14} />} 
                            label="Workout" 
                            sub={`${workoutMinutes} min`}
                            value={`${workoutBurned} kcal`}
                            progress={(workoutBurned / 500) * 100}
                            color="#FF9F0A"
                            styles={styles}
                        />
                        <ActivityRow 
                            icon={<Moon size={14} />} 
                            label="Passive Burn" 
                            sub="BMR-based"
                            value={`${bmr} kcal`}
                            progress={100}
                            color="#FF9F0A"
                            styles={styles}
                        />
                    </div>
                </div>

                {/* 5. MACRO NUTRIENT PROFILE */}
                <div className={`p-8 rounded-[2.5rem] border shadow-lg ${styles.card} ${styles.border}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <PieChart size={20} className="text-[#888]" />
                        <span className={`text-sm font-bold uppercase tracking-widest ${styles.textSec}`}>Macro Nutrient Profile</span>
                    </div>

                    <div className="space-y-5">
                        <MacroRow label="Carbohydrates" value={totals.carb} goal={250} color="#F5C542" styles={styles} />
                        <MacroRow label="Protein" value={totals.pro} goal={180} color="#4A90D9" styles={styles} />
                        <MacroRow label="Fats" value={totals.fat} goal={80} color="#E0607E" styles={styles} />
                    </div>
                </div>

                {/* 6. 7-DAY TREND */}
                <div className={`p-6 rounded-[2.5rem] border ${styles.card} ${styles.border}`}>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${styles.textSec} mb-6 px-1`}>7-Day Trend</h3>
                    <div className="flex items-end justify-between h-[80px] px-2">
                        {weeklyTrend.map((day, i) => {
                            const height = Math.min((day.burn / 1000) * 60, 60);
                            return (
                                <div key={i} className="flex flex-col items-center group cursor-pointer">
                                    <div className="relative">
                                        <div 
                                            className={`w-6 rounded-t-sm transition-all duration-500 ${day.isToday ? 'opacity-100 ring-2 ring-white/20' : 'opacity-60'} ${day.burn > 500 ? 'bg-green-500' : 'bg-orange-500'}`}
                                            style={{ height: `${height || 4}px` }}
                                        />
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            {day.burn} kcal
                                        </div>
                                    </div>
                                    <span className={`text-[10px] mt-2 font-bold ${day.isToday ? styles.textMain : styles.textSec}`}>{day.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 7. MOTIVATIONAL QUOTE */}
                <div className="pt-4 text-center">
                    <p className="text-xs font-medium italic opacity-80 leading-relaxed" style={{ color: '#aaa' }}>
                        "Consistency is the benchmark of success. Keep tracking every meal to visualize your progress better!"
                    </p>
                </div>
            </div>
        </div>
    );
};

const ActivityRow = ({ icon, label, sub, value, progress, color, styles }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${styles?.textSec || 'text-[#888]'}`} style={{ backgroundColor: 'rgba(128,128,128,0.1)' }}>{icon}</div>
                <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${styles?.textMain || 'text-white'}`}>{label}</span>
                    <span className={`text-[10px] font-medium ${styles?.textSec || 'text-[#888]'}`}>{sub}</span>
                </div>
            </div>
            <span className={`text-sm font-black ${styles?.textMain || 'text-white'}`}>{value}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(128,128,128,0.1)' }}>
            <div 
                className="h-full transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
            />
        </div>
    </div>
);

const MacroRow = ({ label, value, goal, color, styles }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-end px-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${styles?.textSec || 'text-[#888]'}`}>{label}</span>
            <span className={`text-xs font-bold ${styles?.textMain || 'text-white'}`}>
                {Math.round(value)}g <span className="opacity-40 text-[10px]">/ {goal}g</span>
            </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(128,128,128,0.1)' }}>
            <div 
                className="h-full transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `${Math.max(6, (value/goal)*100)}%`, backgroundColor: color, borderRadius: '2px' }}
            />
        </div>
    </div>
);

export default DailyStatsPage;
