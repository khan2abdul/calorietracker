import React, { useState, useMemo } from 'react';
import EnergyHistoryGraph from '../EnergyHistoryGraph';
import WeightHistoryGraph from '../WeightHistoryGraph';
import { getLocalDateStr } from '../../utils';

const TIME_RANGES = [14, 30, 60];
const ENERGY_FILTERS = [
    { key: 'combined', label: 'Combined' },
    { key: 'consumed', label: 'Consumed' },
    { key: 'burned', label: 'Burned' },
    { key: 'net', label: 'Net' },
];

const MacroDonut = ({ data, tc }) => {
    const size = 160;
    const stroke = 22;
    const center = size / 2;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = data.pro + data.carb + data.fat || 1;
    const offsets = [0];
    const segments = [
        { pct: data.pro / total, color: 'rgba(96,165,250,0.8)', label: 'Protein' },
        { pct: data.carb / total, color: 'rgba(52,211,153,0.8)', label: 'Carbs' },
        { pct: data.fat / total, color: 'rgba(251,146,60,0.8)', label: 'Fat' },
    ];
    let acc = 0;
    segments.forEach(s => { acc += s.pct; offsets.push(acc); });
    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((s, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - s.pct)}
                        transform={`rotate(${-90 + offsets[i] * 360} ${center} ${center})`}
                        strokeLinecap="round"
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-extrabold" style={{ color: tc.textMain }}>{Math.round(data.cals)}</p>
                <p className="text-xs" style={{ color: tc.textFaint }}>avg kcal</p>
            </div>
        </div>
    );
};

const YearHeatmap = ({ yearData, G_CALS, todayStr }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const year = new Date().getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeap) daysInMonth[1] = 29;

    const getCellClass = (cals, isToday) => {
        if (isToday) return 'heat-good border border-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]';
        if (!cals || cals === 0) return 'heat-none';
        if (cals > G_CALS * 1.1) return 'heat-over';
        if (cals < G_CALS * 0.8) return 'heat-under';
        return 'heat-good';
    };

    return (
        <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-1" style={{ width: 'max-content' }}>
                {months.map((m, mi) => (
                    <div key={m} className="flex flex-col items-center">
                        <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{m}</div>
                        <div className="grid grid-rows-7 grid-flow-col gap-1">
                            {Array.from({ length: daysInMonth[mi] }).map((_, d) => {
                                const dateStr = `${year}-${String(mi + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
                                const log = yearData.find(y => y.date === dateStr);
                                const cals = log?.totals?.cals || 0;
                                const isToday = dateStr === todayStr;
                                return (
                                    <div
                                        key={d}
                                        className={`heat-cell ${getCellClass(cals, isToday)}`}
                                        title={`${m} ${d + 1}: ${cals ? Math.round(cals) + ' kcal' : 'Not logged'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InsightsTab = ({ history, yearData, userStats, tc, theme, G_CALS }) => {
    const [timeRange, setTimeRange] = useState(30);
    const [energyView, setEnergyView] = useState('combined');

    const todayStr = getLocalDateStr(new Date());

    const filteredHistory = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeRange);
        return history
            .filter(h => new Date(h.date + 'T00:00:00') >= cutoff)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [history, timeRange]);

    const energyData = useMemo(() => filteredHistory.map(h => ({
        date: new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        consumed: Math.round(h.totals?.cals || 0),
        burned: Math.round(h.burned || 0),
        net: Math.round((h.totals?.cals || 0) - (h.burned || 0))
    })), [filteredHistory]);

    const weightData = useMemo(() => {
        const pts = [];
        // 1. inject starting weight so the graph shows the journey
        if (userStats?.initialWeight && userStats?.startDate) {
            pts.push({
                fullDate: userStats.startDate,
                weight: userStats.initialWeight,
                date: new Date(userStats.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                isInitial: true
            });
        }
        // 2. all logged weights from history (daily_logs)
        filteredHistory
            .filter(h => h.weight > 0)
            .forEach(h => {
                pts.push({
                    fullDate: h.date,
                    weight: h.weight,
                    date: new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    isInitial: h.weight === userStats?.initialWeight
                });
            });
        // 3. current weight if newer/different from last log
        if (userStats?.weight && userStats.weight > 0) {
            const last = pts[pts.length - 1];
            if (!last || last.weight !== userStats.weight) {
                pts.push({
                    fullDate: getLocalDateStr(new Date()),
                    weight: userStats.weight,
                    date: 'Today',
                    isInitial: false
                });
            }
        }
        // dedupe by fullDate and sort
        const map = new Map();
        pts.forEach(p => map.set(p.fullDate, p));
        return Array.from(map.values()).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }, [filteredHistory, userStats]);

    const macroData = useMemo(() => {
        const totals = filteredHistory.reduce((acc, h) => ({
            pro: acc.pro + (h.totals?.pro || 0),
            carb: acc.carb + (h.totals?.carb || 0),
            fat: acc.fat + (h.totals?.fat || 0),
            cals: acc.cals + (h.totals?.cals || 0)
        }), { pro: 0, carb: 0, fat: 0, cals: 0 });
        const days = filteredHistory.length || 1;
        return {
            pro: totals.pro / days,
            carb: totals.carb / days,
            fat: totals.fat / days,
            cals: totals.cals / days,
        };
    }, [filteredHistory]);

    const hitRate = useMemo(() => {
        const logged = filteredHistory.filter(h => (h.totals?.cals || 0) > 0);
        const total = logged.length || 1;
        const onTarget = logged.filter(h => {
            const c = h.totals?.cals || 0;
            return c > 0 && Math.abs(c - G_CALS) <= G_CALS * 0.15;
        }).length;
        const under = logged.filter(h => (h.totals?.cals || 0) < G_CALS * 0.85).length;
        const over = logged.filter(h => (h.totals?.cals || 0) > G_CALS * 1.15).length;
        return { onTarget, under, over, total };
    }, [filteredHistory, G_CALS]);

    const targetWeight = userStats?.targetWeight;
    const currentWeight = userStats?.weight;
    const initialWeight = userStats?.initialWeight;

    const goalProgressPct = useMemo(() => {
        if (!targetWeight || !initialWeight || !currentWeight) return 0;
        const total = initialWeight - targetWeight;
        const lost = initialWeight - currentWeight;
        if (total <= 0) return 0;
        return Math.min(Math.max((lost / total) * 100, 0), 100);
    }, [targetWeight, initialWeight, currentWeight]);

    return (
        <div className="space-y-4">
            {/* Time Filter */}
            <div className="flex gap-2">
                {TIME_RANGES.map(r => (
                    <button key={r} className={`time-pill text-xs px-4 py-2 rounded-full ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>
                        {r} Days
                    </button>
                ))}
            </div>

            {/* Energy Graph — graph component is already a self-contained card */}
            {energyData.length > 0 && (
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div>
                            <p className="text-sm font-bold" style={{ color: tc.textMain }}>Energy History</p>
                            <p className="text-xs" style={{ color: tc.textFaint }}>kcal over time</p>
                        </div>
                        <span className="text-xs" style={{ color: tc.textFaint }}>{timeRange} days</span>
                    </div>
                    <div className="flex gap-2 mb-3 flex-wrap px-1">
                        {ENERGY_FILTERS.map(f => (
                            <button key={f.key} className={`chart-filter text-xs px-3 py-1 rounded-full border ${energyView === f.key ? 'active' : ''}`} onClick={() => setEnergyView(f.key)}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <EnergyHistoryGraph data={energyData} theme={theme} viewMode={energyView} />
                </div>
            )}

            {/* Weight Progress — graph component is already a self-contained card */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2 px-1">
                    <div>
                        <p className="text-sm font-bold" style={{ color: tc.textMain }}>Weight Progress</p>
                        <p className="text-xs" style={{ color: tc.textFaint }}>kg {targetWeight ? `· goal: ${targetWeight}kg` : ''}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">{currentWeight || '--'}kg</p>
                        <p className="text-xs" style={{ color: tc.textFaint }}>current</p>
                    </div>
                </div>
                {targetWeight && initialWeight && (
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <span className="text-xs" style={{ color: tc.textFaint }}>{initialWeight}kg</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: tc.ringTrack }}>
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${goalProgressPct}%` }} />
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold">{targetWeight}kg</span>
                    </div>
                )}
                {weightData.length > 0 ? (
                    <WeightHistoryGraph
                        data={weightData}
                        theme={theme}
                        userStats={userStats}
                        rangeStart={weightData[0]?.fullDate}
                        rangeEnd={weightData[weightData.length - 1]?.fullDate}
                    />
                ) : (
                    <div className="flex items-center justify-center rounded-3xl p-8 text-xs" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}`, color: tc.textFaint }}>Log weight to see progress</div>
                )}
            </div>

            {/* Macro Breakdown */}
            <div className="rounded-3xl p-5" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                <p className="text-sm font-bold mb-1" style={{ color: tc.textMain }}>Macro Breakdown</p>
                <p className="text-xs mb-4" style={{ color: tc.textFaint }}>{timeRange}-day average</p>
                <div className="flex items-center gap-6 flex-wrap">
                    <MacroDonut data={macroData} tc={tc} />
                    <div className="flex flex-col gap-3">
                        {[
                            { label: 'Protein', pct: macroData.pro, color: 'bg-blue-400' },
                            { label: 'Carbs', pct: macroData.carb, color: 'bg-emerald-400' },
                            { label: 'Fat', pct: macroData.fat, color: 'bg-orange-400' },
                        ].map(m => {
                            const gramSum = macroData.pro + macroData.carb + macroData.fat || 1;
                            const pct = Math.round((m.pct / gramSum) * 100);
                            return (
                                <div key={m.label} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${m.color}`} />
                                    <div>
                                        <p className="text-xs" style={{ color: tc.textMuted }}>{m.label}</p>
                                        <p className="text-sm font-bold" style={{ color: tc.textMain }}>{pct}% · {Math.round(m.pct)}g</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Goal Hit Rate */}
            <div className="rounded-3xl p-5" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                <p className="text-sm font-bold mb-1" style={{ color: tc.textMain }}>Goal Hit Rate</p>
                <p className="text-xs mb-4" style={{ color: tc.textFaint }}>Last {timeRange} days · {hitRate.total} days logged</p>
                <div className="space-y-3">
                    {[
                        { label: 'On target', count: hitRate.onTarget, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
                        { label: 'Under goal', count: hitRate.under, color: 'bg-amber-400', textColor: 'text-amber-400' },
                        { label: 'Over goal', count: hitRate.over, color: 'bg-red-400', textColor: 'text-red-400' },
                    ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                            <span className="text-xs w-20" style={{ color: tc.textMuted }}>{row.label}</span>
                            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: tc.ringTrack }}>
                                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.count / hitRate.total) * 100}%` }} />
                            </div>
                            <span className={`text-xs font-bold w-6 ${row.textColor}`}>{row.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Year Heatmap */}
            <div className="rounded-3xl p-5" style={{ backgroundColor: tc.glassBg, border: `1px solid ${tc.glassBorder}` }}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"></path></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: tc.textMain }}>Year Heatmap</p>
                        <p className="text-xs" style={{ color: tc.textFaint }}>{new Date().getFullYear()} · full year view</p>
                    </div>
                </div>
                <YearHeatmap yearData={yearData} G_CALS={G_CALS} todayStr={todayStr} />
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${tc.glassBorder}` }}>
                    <span className="text-xs" style={{ color: tc.textFaint }}>Less</span>
                    <div className="flex gap-1">
                        <div className="heat-cell heat-none" />
                        <div className="heat-cell heat-under" />
                        <div className="heat-cell heat-good" />
                        <div className="heat-cell heat-over" />
                    </div>
                    <span className="text-xs" style={{ color: tc.textFaint }}>More</span>
                    <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.15)' }}>🟢 on target · 🟡 under · 🔴 over</span>
                </div>
            </div>
        </div>
    );
};

export default InsightsTab;
