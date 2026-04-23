import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalDateStr } from '../../utils';

const OverviewTab = ({ history, activeMonth, setActiveMonth, todayStr, G_CALS, tc, theme, onDayClick, stats, userName }) => {
    const isDark = theme === 'dark';
    const monthLabel = activeMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const firstDayIndex = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();

    // Selected day state (defaults to today)
    const [selectedDayStr, setSelectedDayStr] = useState(todayStr);

    // Derive display data from selected day
    const displayLog = history.find(h => h.date === selectedDayStr) || {};
    const displayCals = Math.round(displayLog?.totals?.cals || 0);
    const displayBurned = Math.round(displayLog?.burned || 0);
    const displayRemaining = Math.max(0, G_CALS - displayCals);
    const displayPro = Math.round(displayLog?.totals?.pro || 0);
    const displayCarb = Math.round(displayLog?.totals?.carb || 0);
    const displayFat = Math.round(displayLog?.totals?.fat || 0);
    const displayWater = displayLog?.waterIntake || 0;

    // Date strip: 7 days around today
    const dateStrip = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = -3; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dStr = getLocalDateStr(d);
            const isToday = dStr === todayStr;
            const label = isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            days.push({ date: d.getDate(), label, isToday, dateStr: dStr });
        }
        return days;
    }, [todayStr]);

    // Ring SVG math
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const eatenPct = Math.min(displayCals / G_CALS, 1);
    const burnedPct = Math.min(displayBurned / G_CALS, 1);
    const eatenOffset = circumference * (1 - eatenPct);
    const burnedOffset = circumference * (1 - burnedPct);

    const monthStats = useMemo(() => {
        const start = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
        const end = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0);
        const monthDays = history.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= start && hDate <= end;
        });
        const loggedDays = monthDays.filter(h => h.totals?.cals > 0);
        const avg = loggedDays.length ? Math.round(loggedDays.reduce((a, b) => a + b.totals.cals, 0) / loggedDays.length) : 0;
        const over = loggedDays.filter(h => h.totals.cals > G_CALS).length;
        let bestDay = { date: '--', kcal: 0 };
        if (loggedDays.length) {
            const best = loggedDays.reduce((prev, current) =>
                (Math.abs(current.totals.cals - G_CALS) < Math.abs(prev.totals.cals - G_CALS)) ? current : prev
            );
            bestDay = { date: new Date(best.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), kcal: Math.round(best.totals.cals) };
        }
        let worstDay = { date: '--', kcal: 0 };
        if (loggedDays.length) {
            const worst = loggedDays.reduce((prev, current) => (current.totals.cals > prev.totals.cals) ? current : prev);
            worstDay = { date: new Date(worst.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), kcal: Math.round(worst.totals.cals) };
        }
        const totalCals = loggedDays.reduce((a, b) => a + b.totals.cals, 0);
        const consistency = end.getDate() ? Math.round((loggedDays.length / end.getDate()) * 100) : 0;
        return { daysLogged: loggedDays.length, totalDays: end.getDate(), avgCalories: avg, overGoalDays: over, bestDay, worstDay, totalCals, consistency };
    }, [history, activeMonth, G_CALS]);

    const getCellStyle = (cals, isToday, isSelected) => {
        if (isSelected) return { background: 'linear-gradient(135deg, rgba(52,211,153,0.55), rgba(34,211,238,0.4))', color: 'rgba(255,255,255,0.9)', outline: '2px solid #34d399', outlineOffset: '2px' };
        if (cals === 0) return { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' };
        if (cals > G_CALS) return { backgroundColor: 'rgba(249,115,22,0.4)', color: 'rgba(255,255,255,0.9)' };
        return { background: 'linear-gradient(135deg, rgba(52,211,153,0.55), rgba(34,211,238,0.4))', color: 'rgba(255,255,255,0.9)' };
    };

    const glassCard = isDark
        ? 'backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]'
        : 'bg-white border border-black/[0.08]';

    const macroData = [
        { label: 'Protein', value: displayPro, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', pct: Math.min((displayPro / 120) * 100, 100) },
        { label: 'Carbs', value: displayCarb, color: '#34d399', bg: 'rgba(52,211,153,0.15)', pct: Math.min((displayCarb / 250) * 100, 100) },
        { label: 'Fat', value: displayFat, color: '#fb923c', bg: 'rgba(251,146,60,0.15)', pct: Math.min((displayFat / 80) * 100, 100) },
        { label: 'Fiber', value: 0, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', pct: 0 },
    ];

    const waterGoal = 8;
    const waterPct = Math.min((displayWater / waterGoal) * 100, 100);

    return (
        <div className="space-y-5">
            {/* ══ DATE STRIP ══ */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-2.5">
                    <button
                        onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))}
                        className="bg-none border-none cursor-pointer text-lg transition-opacity hover:opacity-80"
                        style={{ color: tc.textFaint }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <p className="text-[13px] font-bold" style={{ color: tc.textSec }}>{activeMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    <button
                        onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))}
                        className="bg-none border-none cursor-pointer text-lg transition-opacity hover:opacity-80"
                        style={{ color: tc.textFaint }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {dateStrip.map((d, idx) => {
                        const isSelected = d.dateStr === selectedDayStr;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDayStr(d.dateStr)}
                                className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all min-w-[48px]"
                                style={isSelected
                                    ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }
                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
                                }
                            >
                                <span className="text-[10px] font-semibold" style={{ color: isSelected ? '#34d399' : tc.textFaint }}>{d.label}</span>
                                <span className="text-base font-extrabold" style={{ color: isSelected ? '#fff' : tc.textMain }}>{d.date}</span>
                                {isSelected && <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ══ CALORIE RING + STATS ══ */}
            <div className={`rounded-[28px] p-6 ${glassCard}`}>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-bold" style={{ color: tc.textMain }}>
                        {selectedDayStr === todayStr ? 'Today' : new Date(selectedDayStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    {selectedDayStr !== todayStr && (
                        <button
                            onClick={() => setSelectedDayStr(todayStr)}
                            className="text-[11px] font-bold text-emerald-400 hover:opacity-80 transition"
                        >
                            Back to today
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    {/* Ring */}
                    <div className="relative shrink-0" style={{ width: '120px', height: '120px' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                            <defs>
                                <linearGradient id="eatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                                <linearGradient id="burnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#fb923c" />
                                </linearGradient>
                            </defs>
                            <circle cx="60" cy="60" r="50" fill="none" stroke={tc.ringTrack} strokeWidth="10" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="url(#eatGrad)" strokeWidth="10"
                                strokeDasharray={circumference} strokeDashoffset={eatenOffset} strokeLinecap="round" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="url(#burnGrad)" strokeWidth="10"
                                strokeDasharray={circumference} strokeDashoffset={burnedOffset} strokeLinecap="round"
                                style={{ opacity: 0.7 }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-[22px] font-black leading-none" style={{ color: tc.textMain }}>{displayRemaining}</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: tc.textFaint }}>left</p>
                        </div>
                    </div>

                    {/* Right stats */}
                    <div className="flex-1 flex flex-col gap-3.5">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold" style={{ color: tc.textMuted }}>Goal</span>
                                <span className="text-xs font-extrabold" style={{ color: tc.textMain }}>{G_CALS} kcal</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: tc.ringTrack }}>
                                <div className="h-full rounded-full" style={{ width: '50%', background: 'linear-gradient(90deg, #34d399, #22d3ee)' }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold" style={{ color: tc.textMuted }}>Eaten</span>
                                <span className="text-xs font-extrabold text-emerald-400">{displayCals} kcal</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: tc.ringTrack }}>
                                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min((displayCals / G_CALS) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold" style={{ color: tc.textMuted }}>Burned</span>
                                <span className="text-xs font-extrabold text-orange-400">{displayBurned} kcal</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: tc.ringTrack }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min((displayBurned / G_CALS) * 100, 100)}%`, background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />

                {/* Macro row */}
                <div className="flex gap-3">
                    {macroData.map((m, idx) => (
                        <div key={idx} className="flex-1 text-center">
                            <p className="text-lg font-extrabold" style={{ color: m.color }}>{m.value}g</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: tc.textFaint }}>{m.label}</p>
                            <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: tc.ringTrack }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ WATER TRACKER ══ */}
            <div className={`rounded-3xl p-5 ${glassCard}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[22px]">💧</span>
                        <div>
                            <p className="text-sm font-bold" style={{ color: tc.textMain }}>Water Intake</p>
                            <p className="text-xs" style={{ color: tc.textFaint }}>{displayWater} of {waterGoal} glasses · {displayWater * 250}ml</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-sky-400">{Math.round(waterPct)}%</p>
                        <p className="text-[10px] text-sky-400/50">of goal</p>
                    </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3.5" style={{ background: tc.ringTrack }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg, #38bdf8, #7dd3fc)' }} />
                </div>
                <div className="flex gap-2 justify-between">
                    {Array.from({ length: waterGoal }).map((_, i) => (
                        <div
                            key={i}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all"
                            style={{
                                background: i < displayWater ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                                border: i < displayWater ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                color: i < displayWater ? '#38bdf8' : tc.textFaint
                            }}
                        >
                            {i < displayWater ? '💧' : '○'}
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ DAILY SUMMARY STRIP ══ */}
            <div className="mb-2">
                <p className="text-sm font-bold mb-3" style={{ color: tc.textMain }}>Daily Summary</p>
                <div className="flex gap-2.5">
                    <div className={`flex-1 rounded-[20px] p-4 text-center ${glassCard}`} style={{ borderTop: '2px solid rgba(52,211,153,0.4)' }}>
                        <p className="text-[22px] font-black text-emerald-400">{displayCals}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: tc.textFaint }}>Eaten kcal</p>
                    </div>
                    <div className={`flex-1 rounded-[20px] p-4 text-center ${glassCard}`} style={{ borderTop: '2px solid rgba(249,115,22,0.4)' }}>
                        <p className="text-[22px] font-black text-orange-400">{displayBurned}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: tc.textFaint }}>Burned kcal</p>
                    </div>
                    <div className={`flex-1 rounded-[20px] p-4 text-center ${glassCard}`} style={{ borderTop: '2px solid rgba(56,189,248,0.4)' }}>
                        <p className="text-[22px] font-black text-sky-400">{displayRemaining}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: tc.textFaint }}>Remaining</p>
                    </div>
                </div>
            </div>

            {/* ══ MONTHLY CONSISTENCY ══ */}
            <div className={`rounded-3xl p-5 ${glassCard}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-bold" style={{ color: tc.textMain }}>Monthly Consistency</p>
                        <p className="text-[11px] mt-0.5" style={{ color: tc.textFaint }}>{monthLabel} · {monthStats.daysLogged} / {monthStats.totalDays} days logged</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-emerald-400">{monthStats.consistency}%</p>
                        <p className="text-[10px]" style={{ color: tc.textFaint }}>consistency</p>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[9px] font-bold pb-1" style={{ color: tc.textFaint }}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dateNum = i + 1;
                        const dObj = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), dateNum);
                        const dStr = getLocalDateStr(dObj);
                        const isToday = dStr === todayStr;
                        const isSelected = dStr === selectedDayStr;

                        const dayStats = history.find(h => h.date === dStr);
                        const cals = Math.round(dayStats?.totals?.cals || 0);
                        const style = getCellStyle(cals, isToday, isSelected);

                        return (
                            <button
                                key={`day-${dateNum}`}
                                onClick={() => {
                                    setSelectedDayStr(dStr);
                                    if (onDayClick) onDayClick({ dateObj: dObj, stats: dayStats });
                                }}
                                className="aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-all duration-200 active:scale-90 hover:scale-110"
                                style={style}
                            >
                                {dateNum}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 pt-3 flex flex-wrap gap-x-4 gap-y-2" style={{ borderTop: `1px solid ${tc.glassBorder}` }}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.55), rgba(34,211,238,0.4))' }} />
                        <span className="text-[10px]" style={{ color: tc.textFaint }}>Logged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(249,115,22,0.5)' }} />
                        <span className="text-[10px]" style={{ color: tc.textFaint }}>Over goal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <span className="text-[10px]" style={{ color: tc.textFaint }}>Not logged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm border-2 border-emerald-400" />
                        <span className="text-[10px]" style={{ color: tc.textFaint }}>Today</span>
                    </div>
                </div>
            </div>

            {/* ══ MONTHLY STATS STRIP ══ */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
                <div className="flex gap-3 w-max">
                    <div className={`rounded-2xl p-4 w-[140px] shrink-0 ${glassCard}`}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tc.textMuted }}>Logged</p>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-[28px] font-extrabold" style={{ color: tc.textMain }}>{monthStats.daysLogged}</span>
                            <span className="text-sm font-medium" style={{ color: tc.textFaint }}>/{monthStats.totalDays}</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: tc.ringTrack }}>
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(monthStats.daysLogged / monthStats.totalDays) * 100}%` }} />
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>days this month</p>
                    </div>

                    <div className={`rounded-2xl p-4 w-[140px] shrink-0 ${glassCard}`}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tc.textMuted }}>Average</p>
                        <div className="mt-2">
                            <span className="text-[28px] font-extrabold text-emerald-400">{monthStats.avgCalories}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400/60 mt-1 font-semibold">kcal / day</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>vs {G_CALS} goal</p>
                    </div>

                    <div className={`rounded-2xl p-4 w-[140px] shrink-0 ${glassCard}`}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tc.textMuted }}>Best Peak</p>
                        <div className="mt-2">
                            <span className="text-[28px] font-extrabold text-amber-400">{monthStats.bestDay.kcal}</span>
                        </div>
                        <p className="text-[10px] text-amber-400/60 mt-1 font-semibold">on {monthStats.bestDay.date}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>highest logged</p>
                    </div>

                    <div className={`rounded-2xl p-4 w-[140px] shrink-0 ${glassCard}`}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tc.textMuted }}>Best Streak</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[28px] font-extrabold text-cyan-400">{stats.longest}</span>
                            <span className="text-xl">🔥</span>
                        </div>
                        <p className="text-[10px] text-cyan-400/60 mt-1 font-semibold">days in a row</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>current: {stats.streak}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
