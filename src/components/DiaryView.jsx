import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase.js';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { Flame, ChevronLeft, ChevronRight, X, Lock, Zap, Target, Scale, Activity, PieChart } from 'lucide-react';
import { getLocalDateStr } from '../utils'; 

const DiaryView = ({ theme, user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [activeMonth, setActiveMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    // Constants & Colors
    const C_ORG = '#E07B39';
    const C_GRN = '#7EC8A4';
    const C_RED = '#E05050';
    const C_YEL = '#F5C542';
    const C_GRY = '#2A2A2A';

    useEffect(() => {
        if (!user) return;

        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) setUserStats(docSnap.data());
        });

        // Fetch history logs for Active Month + 1 month buffer
        const startDate = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const startTime = startDate.getTime();
        const startDateStr = startDate.toISOString().split('T')[0];

        const qLogs = query(collection(db, 'users', user.uid, 'daily_logs'), where('__name__', '>=', startDateStr));
        const qActivities = query(collection(db, 'activities'), where('userId', '==', user.uid));

        let logsData = [];
        let activitiesData = [];

        const updateCombined = () => {
            const daysMap = {};
            logsData.forEach(day => { daysMap[day.date] = { ...day, burned: day.burned || 0 }; });
            activitiesData.forEach(act => {
                if (!act.date) return;
                let date = typeof act.date.toDate === 'function' ? act.date.toDate() : new Date(act.date);
                if (date.getTime() < startTime) return;
                const dateStr = getLocalDateStr(date);
                if (!daysMap[dateStr]) {
                    daysMap[dateStr] = { date: dateStr, totals: { cals: 0, pro: 0, carb: 0, fat: 0 }, burned: 0, foodLogs: {}, isVirtual: true };
                }
                daysMap[dateStr].burned += (Number(act.caloriesBurned) || 0);
            });
            const merged = Object.values(daysMap).sort((a, b) => b.date.localeCompare(a.date));
            setHistory(merged);
            setLoading(false);
        };

        const unsubLogs = onSnapshot(qLogs, (snap) => { logsData = snap.docs.map(d => ({ date: d.id, ...d.data() })); updateCombined(); });
        const unsubActs = onSnapshot(qActivities, (snap) => { activitiesData = snap.docs.map(d => ({ id: d.id, ...d.data() })); updateCombined(); });

        return () => { unsubUser(); unsubLogs(); unsubActs(); };
    }, [user, activeMonth]);

    const G_CALS = userStats?.goalCals || 2000;

    const stats = useMemo(() => {
        if (!history.length) return { streak: 0, longest: 0 };
        const todayStr = getLocalDateStr(new Date());
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        let streak = 0;
        let longest = 0;
        let currentStreak = 0;

        const sorted = [...history].sort((a,b) => a.date.localeCompare(b.date));
        
        for (let i=0; i<sorted.length; i++) {
            if (sorted[i].totals.cals > 0) {
                if (i === 0 || new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime() <= 86400000 * 1.5) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 0;
            }
            if (currentStreak > longest) longest = currentStreak;
            
            if (sorted[i].date === todayStr || sorted[i].date === yesterdayStr) {
                 streak = currentStreak;
            }
        }
        
        return { streak, longest: longest > streak ? longest : streak };
    }, [history]);

    const monthStats = useMemo(() => {
        const start = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
        const end = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
        const monthDays = history.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= start && hDate <= end;
        });

        const loggedDays = monthDays.filter(h => h.totals.cals > 0);
        const avg = loggedDays.length ? Math.round(loggedDays.reduce((a, b) => a + b.totals.cals, 0) / loggedDays.length) : 0;
        const over = loggedDays.filter(h => h.totals.cals > G_CALS).length;
        
        let bestDay = { date: '--', kcal: 0 };
        if (loggedDays.length) {
            const best = loggedDays.reduce((prev, current) => 
                (Math.abs(current.totals.cals - G_CALS) < Math.abs(prev.totals.cals - G_CALS)) ? current : prev
            );
            bestDay = {
                 date: new Date(best.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                 kcal: Math.round(best.totals.cals)
            };
        }

        return {
            daysLogged: loggedDays.length,
            totalDays: end.getDate(),
            avgCalories: avg,
            overGoalDays: over,
            bestDay
        };
    }, [history, activeMonth, G_CALS]);

    const firstDayIndex = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
    
    const renderDayInsight = () => {
        if (!selectedDay) return (
            <div className="bg-[#1A1A1A] border border-dashed border-[rgba(255,255,255,0.06)] rounded-[32px] p-10 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Target size={24} className="text-[#888888] opacity-50" />
                </div>
                <p className="text-[14px] font-bold text-[#888888]">Select a day to view deep insights</p>
                <p className="text-[11px] text-[#555555] mt-1 uppercase tracking-widest font-black">Your journey history</p>
            </div>
        );

        const { dateObj, stats } = selectedDay;
        const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        
        const pro = Math.round(stats?.totals?.pro || 0);
        const carb = Math.round(stats?.totals?.carb || 0);
        const fat = Math.round(stats?.totals?.fat || 0);
        const cals = Math.round(stats?.totals?.cals || 0);
        const burned = Math.round(stats?.burned || 0);
        const net = cals - burned;

        const isToday = getLocalDateStr(dateObj) === todayStr;

        return (
            <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[32px] overflow-hidden shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-[18px] font-black text-[#F5F5F5] leading-none mb-1">{displayDate}</h3>
                        <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{isToday ? "Current Day" : "Historical Insight"}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Energy Balance */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0F0F0F] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={14} className="text-[#34C759]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Eaten</span>
                            </div>
                            <p className={`text-[28px] font-black leading-none ${cals > G_CALS ? 'text-[#E05050]' : 'text-[#F5F5F5]'}`}>{cals}</p>
                            <p className="text-[10px] font-medium text-[#555555] mt-1">Goal: {G_CALS} kcal</p>
                        </div>
                        <div className="bg-[#0F0F0F] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={14} className="text-[#FF9F0A]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Burned</span>
                            </div>
                            <p className="text-[28px] font-black leading-none text-[#F5F5F5]">{burned}</p>
                            <p className="text-[10px] font-medium text-[#555555] mt-1">Exercise & Active</p>
                        </div>
                    </div>

                    {/* Macro Split */}
                    <div className="bg-[#0F0F0F] rounded-[24px] p-6 border border-[rgba(255,255,255,0.04)]">
                        <div className="flex items-center gap-2 mb-5">
                            <PieChart size={14} className="text-[#0A84FF]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Macro Nutrients</span>
                        </div>
                        <div className="space-y-4">
                            <MacroBar label="Protein" val={pro} max={Math.round(G_CALS * 0.3 / 4)} color="#4A90D9" />
                            <MacroBar label="Carbs" val={carb} max={Math.round(G_CALS * 0.4 / 4)} color="#F5C542" />
                            <MacroBar label="Fats" val={fat} max={Math.round(G_CALS * 0.3 / 9)} color="#E0607E" />
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="flex items-center gap-4 bg-white/5 rounded-[24px] p-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
                            {cals === 0 ? "🌙" : (cals <= G_CALS ? "✨" : "🔥")}
                        </div>
                        <div>
                            <p className="text-[14px] font-black text-[#F5F5F5]">
                                {cals === 0 ? "Rest Day" : (cals <= G_CALS ? "Perfect Balance" : "High Energy Surplus")}
                            </p>
                            <p className="text-[11px] font-medium text-[#888888]">
                                {cals === 0 ? "No nutrition logged for this date." : 
                                 cals <= G_CALS ? "You hit your metabolic target precisely." : "Fueling for growth or recovery today."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const MacroBar = ({ label, val, max, color }) => (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#555555] uppercase tracking-wider">{label}</span>
                <span className="text-[#F5F5F5]">{val}g <span className="opacity-20">/ {max}g</span></span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((val/max)*100, 100)}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );

    const todayStr = getLocalDateStr(new Date());

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#F5F5F5] font-sans flex justify-center pb-24 overflow-x-hidden pt-5 px-6">
            <div className="w-full max-w-[430px] animate-fade-in relative">
                <header className="flex justify-between items-start mb-10 pt-4">
                    <div>
                        <h1 className="text-[34px] font-black tracking-tight leading-none text-[#F5F5F5] mb-2">Diary</h1>
                        <p className="text-[14px] font-medium text-[#888888] flex items-center gap-2">
                             Your Journey <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] font-bold">JOURNAL</span>
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        {stats.streak > 0 && (
                            <div className="flex items-center gap-2 bg-[#E07B39]/10 border border-[#E07B39]/20 px-4 py-1.5 rounded-full shadow-lg shadow-[#E07B39]/5">
                                <Flame size={14} className="text-[#E07B39] fill-[#E07B39]" />
                                <span className="text-[12px] font-black text-[#E07B39] tracking-tight">{stats.streak} DAYS</span>
                            </div>
                        )}
                        <div className="flex items-center gap-4 bg-[#1A1A1A] rounded-2xl px-3 py-2 border border-[rgba(255,255,255,0.06)] shadow-xl">
                            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-white/5 active:scale-90 transition">
                                <ChevronLeft size={18} className="text-[#888888]"/>
                            </button>
                            <span className="text-[13px] font-black text-[#F5F5F5] min-w-[90px] text-center uppercase tracking-[0.1em]">
                                {activeMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-white/5 active:scale-90 transition">
                                <ChevronRight size={18} className="text-[#888888]"/>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="space-y-6">
                    {/* Monthly Performance Highlights (Moved to Top) */}
                    <div className="overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar animate-fade-in">
                        <div className="flex gap-4">
                            <div className="flex flex-col min-w-[120px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shrink-0 shadow-xl transition-transform hover:-translate-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">Logged</p>
                                <p className="text-[24px] font-black leading-none text-[#F5F5F5]">{monthStats.daysLogged}<span className="text-[14px] font-medium opacity-30 ml-1">/{monthStats.totalDays}</span></p>
                                <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-500" style={{ width: `${(monthStats.daysLogged/monthStats.totalDays)*100}%` }}></div>
                                </div>
                            </div>
                            <div className="flex flex-col min-w-[120px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shrink-0 shadow-xl transition-transform hover:-translate-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">Average</p>
                                <p className="text-[24px] font-black leading-none text-[#F5F5F5]">{monthStats.avgCalories}</p>
                                <p className="text-[10px] font-bold text-[#7EC8A4] mt-2 italic">KCAL / DAY</p>
                            </div>
                            <div className="flex flex-col min-w-[140px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shrink-0 shadow-xl transition-transform hover:-translate-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">Best Peak</p>
                                <p className="text-[24px] font-black leading-none text-[#F5F5F5]">{monthStats.bestDay.kcal}</p>
                                <p className="text-[10px] font-bold text-[#F5C542] mt-2 uppercase tracking-tighter">On {monthStats.bestDay.date}</p>
                            </div>
                            <div className="flex flex-col min-w-[120px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shrink-0 shadow-xl transition-transform hover:-translate-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-3">Surplus</p>
                                <p className="text-[24px] font-black leading-none text-[#F5F5F5]">{monthStats.overGoalDays}</p>
                                <p className="text-[10px] font-bold text-[#E05050] mt-2 uppercase tracking-tighter">DAYS OVER</p>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Section */}
                    <section className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="text-[11px] uppercase text-[#888888] font-bold tracking-[0.2em]">Consistency Grid</h2>
                            <div className="flex gap-1.5">
                                {[C_GRN, C_YEL, C_RED].map((c, i) => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }}></div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-y-4 mb-2 relative z-10">
                            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d,i) => (
                                <div key={`header-${i}`} className="text-center text-[9px] font-black text-[#555555] tracking-widest">{d}</div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-4 place-items-center relative z-10">
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} className="w-[36px] h-[36px]"></div>
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dateNum = i + 1;
                                const dObj = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), dateNum);
                                const dStr = getLocalDateStr(dObj);
                                const isToday = dStr === todayStr;
                                
                                const dayStats = history.find(h => h.date === dStr);
                                const cals = Math.round(dayStats?.totals?.cals || 0);

                                let bgColor = C_GRY;
                                if (cals > 0) {
                                    if (cals > G_CALS) bgColor = C_RED;
                                    else if (cals < (G_CALS * 0.4)) bgColor = C_YEL;
                                    else bgColor = C_GRN;
                                }

                                return (
                                    <button 
                                        key={`day-${dateNum}`}
                                        onClick={() => setSelectedDay({ dateObj: dObj, stats: dayStats })}
                                        className={`w-[36px] h-[36px] rounded-[12px] flex items-center justify-center relative transition-all duration-300 active:scale-90 hover:brightness-125`}
                                        style={{ backgroundColor: bgColor }}
                                    >
                                        {isToday && (
                                            <div className="absolute inset-[-4px] rounded-[14px] border-2 border-[#E07B39] shadow-[0_0_15px_rgba(224,123,57,0.3)]"></div>
                                        )}
                                        <span className={`text-[10px] font-black ${cals > 0 ? 'text-black/40 mix-blend-overlay' : 'text-[#888888]'}`}>{dateNum}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Inline Deep Insight Section */}
                    {renderDayInsight()}

                </div>

                <div className="h-20"></div> {/* Bottom spacer */}

            </div>
            
            <style jsx="true">{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default DiaryView;
