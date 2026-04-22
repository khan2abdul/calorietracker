import os

replacement = """import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase.js';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { Flame, ChevronLeft, ChevronRight, X, Lock } from 'lucide-react';
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
    
    const renderBottomSheet = () => {
        if (!selectedDay) return null;
        const { dateObj, stats } = selectedDay;
        const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        
        const pro = Math.round(stats?.totals?.pro || 0);
        const carb = Math.round(stats?.totals?.carb || 0);
        const fat = Math.round(stats?.totals?.fat || 0);
        const cals = Math.round(stats?.totals?.cals || 0);

        return (
            <>
                <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={() => setSelectedDay(null)}></div>
                <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[24px] p-6 z-50 transform transition-transform duration-300 translate-y-0 shadow-2xl border-t border-[rgba(255,255,255,0.06)]" style={{ maxWidth: '430px', margin: '0 auto' }}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[20px] font-bold text-[#F5F5F5]">{displayDate}</h3>
                            <p className="text-[14px] text-[#888888]">Daily Summary</p>
                        </div>
                        <button onClick={() => setSelectedDay(null)} className="p-2 bg-white/5 rounded-full active:scale-90 transition">
                            <X size={18} className="text-[#888888]"/>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 bg-[#0F0F0F] rounded-[16px] p-4 text-center border border-[rgba(255,255,255,0.04)]">
                            <p className="text-[11px] uppercase tracking-wider text-[#888888] font-bold mb-1">Calories</p>
                            <p className={`text-[24px] font-black ${cals > G_CALS ? 'text-[#E05050]' : (cals > 0 ? 'text-[#7EC8A4]' : 'text-[#888888]')}`}>{cals}</p>
                        </div>
                        <div className="flex-1 bg-[#0F0F0F] rounded-[16px] p-4 border border-[rgba(255,255,255,0.04)]">
                            <div className="flex justify-between text-[11px] font-bold mb-1"><span className="text-[#888888]">PRO</span><span className="text-[#F5F5F5]">{pro}g</span></div>
                            <div className="flex justify-between text-[11px] font-bold mb-1"><span className="text-[#888888]">CARB</span><span className="text-[#F5F5F5]">{carb}g</span></div>
                            <div className="flex justify-between text-[11px] font-bold"><span className="text-[#888888]">FAT</span><span className="text-[#F5F5F5]">{fat}g</span></div>
                        </div>
                    </div>

                    <div className="bg-[#0F0F0F] rounded-[16px] p-4 flex items-center gap-3 border border-[rgba(255,255,255,0.04)]">
                        <div className="text-[24px]">🏆</div>
                        <div>
                            <p className="text-[13px] font-bold text-[#F5F5F5]">{cals > 0 && cals <= G_CALS ? "On Track Day" : (cals > 0 ? "Logged Day" : "Rest Day")}</p>
                            <p className="text-[11px] text-[#888888]">Keep logging consistently!</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const todayStr = getLocalDateStr(new Date());

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#F5F5F5] font-sans flex justify-center pb-24 overflow-x-hidden pt-5 px-6">
            <div className="w-full max-w-[430px] animate-fade-in relative">
                <header className="flex justify-between items-end mb-8 pt-4">
                    <div>
                        <h1 className="text-[32px] font-black tracking-tight leading-none text-[#F5F5F5] mb-1">Diary</h1>
                        <p className="text-[14px] font-medium text-[#888888]">Your Journey 📓</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        {stats.streak > 0 ? (
                            <div className="flex items-center gap-1.5 bg-[#E07B39]/10 border border-[#E07B39]/20 px-3 py-1 rounded-full">
                                <Flame size={12} className="text-[#E07B39] fill-[#E07B39]" />
                                <span className="text-[11px] font-bold text-[#E07B39]">{stats.streak} days</span>
                            </div>
                        ) : <div className="h-6"></div>}
                        <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-full px-1.5 py-1 border border-[rgba(255,255,255,0.06)] shadow-lg">
                            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))} className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition">
                                <ChevronLeft size={14} className="text-[#888888]"/>
                            </button>
                            <span className="text-[12px] font-bold text-[#F5F5F5] w-[90px] text-center uppercase tracking-wide">
                                {activeMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <button onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))} className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition">
                                <ChevronRight size={14} className="text-[#888888]"/>
                            </button>
                        </div>
                    </div>
                </header>

                <section className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 mb-5 shadow-xl">
                    <div className="grid grid-cols-7 gap-y-3 mb-2">
                        {['S','M','T','W','T','F','S'].map((d,i) => (
                            <div key={`header-${i}`} className="text-center text-[10px] font-bold text-[#888888]">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-3 gap-x-2 place-items-center">
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-[34px] h-[34px]"></div>
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
                                <div 
                                    key={`day-${dateNum}`}
                                    onClick={() => setSelectedDay({ dateObj: dObj, stats: dayStats })}
                                    className={`w-[34px] h-[34px] rounded-[10px] flex justify-end items-end p-1.5 cursor-pointer relative shadow-sm transition active:scale-90`}
                                    style={{ backgroundColor: bgColor }}
                                >
                                    {isToday && (
                                        <div className="absolute inset-[-3px] rounded-[10px] border-2 border-[#E07B39]"></div>
                                    )}
                                    <span className={`text-[9px] font-bold leading-none ${cals > 0 ? 'text-black/40 mix-blend-color-burn' : 'text-[#888888]'}`}>{dateNum}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="flex gap-3 overflow-x-auto pb-4 mb-2 -mx-6 px-6 hide-scrollbar">
                    <div className="flex flex-col justify-center min-w-[110px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-4 shrink-0 shadow-lg">
                        <span className="text-[20px] mb-1">📅</span>
                        <p className="text-[20px] font-black leading-tight text-[#F5F5F5]">{monthStats.daysLogged}<span className="text-[12px] font-medium text-[#888888]">/{monthStats.totalDays}</span></p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mt-1">Days Logged</p>
                    </div>
                    <div className="flex flex-col justify-center min-w-[110px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-4 shrink-0 shadow-lg">
                        <span className="text-[20px] mb-1">🔥</span>
                        <p className="text-[20px] font-black leading-tight text-[#F5F5F5]">{monthStats.avgCalories}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mt-1">Avg Calories</p>
                    </div>
                    <div className="flex flex-col justify-center min-w-[130px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-4 shrink-0 shadow-lg">
                        <span className="text-[20px] mb-1">🏆</span>
                        <p className="text-[20px] font-black leading-tight text-[#F5F5F5]">{monthStats.bestDay.kcal}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mt-1">Best ({monthStats.bestDay.date})</p>
                    </div>
                    <div className="flex flex-col justify-center min-w-[110px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-4 shrink-0 shadow-lg">
                        <span className="text-[20px] mb-1">⚠️</span>
                        <p className="text-[20px] font-black leading-tight text-[#F5F5F5]">{monthStats.overGoalDays}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mt-1">Days Over</p>
                    </div>
                </section>

                <section className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 mb-5 shadow-xl h-[180px] flex flex-col">
                    <h2 className="text-[11px] uppercase text-[#888888] font-bold tracking-widest mb-4">Past 7 Days Trend</h2>
                    
                    <div className="flex-1 relative flex items-stretch justify-between gap-2.5 w-full mt-1">
                        <div className="absolute left-0 right-0 border-t-2 border-dashed border-[rgba(255,255,255,0.1)]" style={{ bottom: `50%` }}></div>
                        <span className="absolute text-[9px] font-bold text-[#888888] tracking-widest" style={{ bottom: `calc(50% + 4px)`, right: 0 }}>GOAL</span>

                        {Array.from({length: 7}).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            const dStr = getLocalDateStr(d);
                            const hMatch = history.find(h => h.date === dStr);
                            const cal = Math.round(hMatch?.totals?.cals || 0);
                            
                            const maxWeekCals = G_CALS * 2; 
                            const isOver = cal > G_CALS;
                            const hPct = Math.min((cal / maxWeekCals) * 100, 100) || 2; 
                            const isTodayBar = i === 6;

                            let bColor = cal === 0 ? '#2A2A2A' : (isOver ? C_RED : C_GRN);
                            if (isTodayBar && cal > 0) bColor = C_ORG;

                            return (
                                <div key={`bar-${i}`} className="flex flex-col items-center justify-end gap-2 flex-1 h-full z-10 w-full group relative">
                                    <div className="w-full relative flex items-end justify-center h-full rounded-[6px] overflow-hidden bg-[#0A0A0A]">
                                        <div 
                                            className="w-full rounded-[6px] transition-all duration-700 ease-in-out cursor-pointer hover:opacity-80"
                                            style={{ height: `${hPct}%`, backgroundColor: bColor }}
                                        ></div>
                                    </div>
                                    <span className={`text-[10px] font-bold ${isTodayBar ? 'text-[#F5F5F5]' : 'text-[#888888]'}`}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 mb-8 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-[11px] uppercase text-[#888888] font-bold tracking-widest leading-tight">Current Streak</h2>
                            <p className="text-[22px] font-black text-[#F5F5F5]">{stats.streak} <span className="text-[14px] font-medium text-[#888888]">days</span></p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-[11px] uppercase text-[#888888] font-bold tracking-widest leading-tight">Longest Streak</h2>
                            <p className="text-[22px] font-black text-[#F5F5F5]">{stats.longest} <span className="text-[14px] font-medium text-[#888888]">days</span></p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] ${stats.longest > 0 ? '' : 'opacity-40 grayscale'}`}>
                            <span className="text-[16px]">🌱</span>
                            <span className="text-[12px] font-semibold text-[#F5F5F5]">First Log</span>
                            {stats.longest === 0 && <Lock size={12} className="text-[#888888] ml-1" />}
                        </div>
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] ${stats.longest >= 7 ? '' : 'opacity-40 grayscale'}`}>
                            <span className="text-[16px]">🔥</span>
                            <span className="text-[12px] font-semibold text-[#F5F5F5]">7-Day Streak</span>
                            {stats.longest < 7 && <Lock size={12} className="text-[#888888] ml-1" />}
                        </div>
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] ${stats.longest >= 30 ? '' : 'opacity-40 grayscale'}`}>
                            <span className="text-[16px]">🏆</span>
                            <span className="text-[12px] font-semibold text-[#F5F5F5]">30-Day Legend</span>
                            {stats.longest < 30 && <Lock size={12} className="text-[#888888] ml-1" />}
                        </div>
                    </div>
                </section>

                {renderBottomSheet()}
            </div>
            
            <style jsx="true">{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default DiaryView;
"""
with open('src/components/DiaryView.jsx', 'w', encoding='utf-8') as f:
    f.write(replacement)
print('Done!')
