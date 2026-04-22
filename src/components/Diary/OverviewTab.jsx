import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalDateStr } from '../../utils';

const OverviewTab = ({ history, activeMonth, setActiveMonth, todayStr, G_CALS, tc, theme, onDayClick, stats, userName }) => {
    const monthLabel = activeMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const firstDayIndex = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();

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
            bestDay = {
                date: new Date(best.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                kcal: Math.round(best.totals.cals)
            };
        }
        let worstDay = { date: '--', kcal: 0 };
        if (loggedDays.length) {
            const worst = loggedDays.reduce((prev, current) =>
                (current.totals.cals > prev.totals.cals) ? current : prev
            );
            worstDay = {
                date: new Date(worst.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                kcal: Math.round(worst.totals.cals)
            };
        }
        const totalCals = loggedDays.reduce((a, b) => a + b.totals.cals, 0);
        return {
            daysLogged: loggedDays.length,
            totalDays: end.getDate(),
            avgCalories: avg,
            overGoalDays: over,
            bestDay,
            worstDay,
            totalCals
        };
    }, [history, activeMonth, G_CALS]);

    const getCellStyle = (cals, isToday) => {
        if (isToday) return { backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', boxShadow: '0 0 0 2px rgba(52,211,153,0.5)' };
        if (cals === 0) return { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' };
        if (cals > G_CALS) return { backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171' };
        if (cals < G_CALS * 0.4) return { backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24' };
        return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' };
    };

    return (
        <div className="space-y-5">
            {/* Month Nav */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-90 hover:opacity-80"
                    style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.glassBorder}` }}
                >
                    <ChevronLeft size={16} style={{ color: tc.textMain, opacity: 0.4 }} />
                </button>
                <div
                    className="flex-1 py-2.5 rounded-2xl text-center"
                    style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.glassBorder}` }}
                >
                    <span className="text-base font-bold tracking-wide" style={{ color: tc.textMain }}>{monthLabel}</span>
                </div>
                <button
                    onClick={() => setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-90 hover:opacity-80"
                    style={{ backgroundColor: tc.pillBg, border: `1px solid ${tc.glassBorder}` }}
                >
                    <ChevronRight size={16} style={{ color: tc.textMain, opacity: 0.4 }} />
                </button>
            </div>

            {/* Stats Strip */}
            <div className="overflow-x-auto -mx-5 px-5 pb-1 no-scrollbar">
                <div className="flex gap-3 w-max">
                    <div className="rounded-2xl p-4 w-[140px] shrink-0" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: tc.textMuted }}>Logged</p>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-[28px] font-extrabold" style={{ color: tc.textMain }}>{monthStats.daysLogged}</span>
                            <span className="text-sm font-medium" style={{ color: tc.textFaint }}>/{monthStats.totalDays}</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: tc.ringTrack }}>
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(monthStats.daysLogged / monthStats.totalDays) * 100}%` }} />
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>days this month</p>
                    </div>

                    <div className="rounded-2xl p-4 w-[140px] shrink-0" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: tc.textMuted }}>Average</p>
                        <div className="mt-2">
                            <span className="text-[28px] font-extrabold text-emerald-400">{monthStats.avgCalories}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400/60 mt-1 font-semibold">kcal / day</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>vs {G_CALS} goal</p>
                    </div>

                    <div className="rounded-2xl p-4 w-[140px] shrink-0" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: tc.textMuted }}>Best Peak</p>
                        <div className="mt-2">
                            <span className="text-[28px] font-extrabold text-amber-400">{monthStats.bestDay.kcal}</span>
                        </div>
                        <p className="text-[10px] text-amber-400/60 mt-1 font-semibold">on {monthStats.bestDay.date}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>highest logged</p>
                    </div>

                    <div className="rounded-2xl p-4 w-[140px] shrink-0" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: tc.textMuted }}>Best Streak</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[28px] font-extrabold text-cyan-400">{stats.longest}</span>
                            <span className="text-xl">🔥</span>
                        </div>
                        <p className="text-[10px] text-cyan-400/60 mt-1 font-semibold">days in a row</p>
                        <p className="text-[10px] mt-1.5" style={{ color: tc.textFaint }}>current: {stats.streak}</p>
                    </div>
                </div>
            </div>

            {/* Consistency Grid */}
            <div className="rounded-3xl p-5" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <span className="text-sm font-bold" style={{ color: tc.textMain }}>Consistency Grid</span>
                    </div>
                    <span className="text-xs" style={{ color: tc.textFaint }}>{monthLabel}</span>
                </div>

                <div className="grid grid-cols-7 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[11px] font-medium" style={{ color: tc.textFaint }}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 place-items-center">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-9 h-9" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dateNum = i + 1;
                        const dObj = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), dateNum);
                        const dStr = getLocalDateStr(dObj);
                        const isToday = dStr === todayStr;

                        const dayStats = history.find(h => h.date === dStr);
                        const cals = Math.round(dayStats?.totals?.cals || 0);
                        const style = getCellStyle(cals, isToday);

                        return (
                            <button
                                key={`day-${dateNum}`}
                                onClick={() => onDayClick && onDayClick({ dateObj: dObj, stats: dayStats })}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-300 active:scale-90 hover:brightness-125"
                                style={style}
                            >
                                {dateNum}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 pt-4 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${tc.glassBorder}` }}>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: tc.textMuted }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} /> On target
                    </div>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: tc.textMuted }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.2)' }} /> Under goal
                    </div>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: tc.textMuted }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.2)' }} /> Over goal
                    </div>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: tc.textMuted }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} /> Not logged
                    </div>
                </div>
            </div>

            {/* Monthly Summary */}
            <div>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 px-1" style={{ color: tc.textMuted }}>Monthly Summary</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 border-l-[3px] border-emerald-400" style={{ backgroundColor: tc.glassBg, borderRight: `1px solid ${tc.glassBorder}`, borderTop: `1px solid ${tc.glassBorder}`, borderBottom: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: tc.textMuted }}>Total Logged</p>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1">{monthStats.totalCals.toLocaleString()}</p>
                        <p className="text-[10px] mt-1" style={{ color: tc.textFaint }}>kcal this month</p>
                    </div>

                    <div className="rounded-2xl p-4 border-l-[3px] border-cyan-400" style={{ backgroundColor: tc.glassBg, borderRight: `1px solid ${tc.glassBorder}`, borderTop: `1px solid ${tc.glassBorder}`, borderBottom: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: tc.textMuted }}>Avg vs Goal</p>
                        <p className="text-2xl font-extrabold text-cyan-400 mt-1">{monthStats.avgCalories}</p>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: tc.ringTrack }}>
                            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min((monthStats.avgCalories / G_CALS) * 100, 100)}%` }} />
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: tc.textFaint }}>of {G_CALS} kcal</p>
                    </div>

                    <div className="rounded-2xl p-4 border-l-[3px] border-amber-400" style={{ backgroundColor: tc.glassBg, borderRight: `1px solid ${tc.glassBorder}`, borderTop: `1px solid ${tc.glassBorder}`, borderBottom: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: tc.textMuted }}>Best Streak</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <p className="text-2xl font-extrabold text-amber-400">{stats.longest}</p>
                            <span className="text-xl">🔥</span>
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: tc.textFaint }}>days in a row</p>
                    </div>

                    <div className="rounded-2xl p-4 border-l-[3px] border-red-400" style={{ backgroundColor: tc.glassBg, borderRight: `1px solid ${tc.glassBorder}`, borderTop: `1px solid ${tc.glassBorder}`, borderBottom: `1px solid ${tc.glassBorder}` }}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: tc.textMuted }}>Worst Day</p>
                        <p className="text-2xl font-extrabold text-red-400 mt-1">{monthStats.worstDay.date}</p>
                        <p className="text-[10px] mt-1" style={{ color: tc.textFaint }}>{monthStats.worstDay.kcal > 0 ? `${monthStats.worstDay.kcal} kcal` : 'most over goal'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
