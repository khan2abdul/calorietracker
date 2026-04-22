import React, { useState } from 'react';
import { THEMES } from '../theme';

const WeightHistoryGraph = ({ data, theme, userStats, rangeStart, rangeEnd }) => {
    const height = 260;
    const width = 340;
    const padL = 36;
    const padR = 10;
    const padT = 14;
    const padB = 28;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const styles = THEMES[theme];

    const initialWeight = userStats?.initialWeight;
    const targetWeight = userStats?.targetWeight;
    const userHeight = (userStats?.height || 0) / 100;

    // Healthy BMI range
    const minHealthy = userHeight > 0 ? Math.round(18.5 * userHeight * userHeight) : 0;
    const maxHealthy = userHeight > 0 ? Math.round(25 * userHeight * userHeight) : 0;

    // Tooltip state
    const [tooltip, setTooltip] = useState(null);

    // ---- Safe date parsing ----
    const toDay = (str) => {
        if (!str) return 0;
        const clean = String(str).substring(0, 10);
        return new Date(clean + 'T12:00:00').getTime();
    };

    // X-axis (time-based)
    const t0 = rangeStart ? toDay(rangeStart) : toDay(data[0]?.fullDate);
    const t1 = rangeEnd ? toDay(rangeEnd) : toDay(data[data.length - 1]?.fullDate);
    const tSpan = Math.max(1, t1 - t0);

    const getX = (dateStr) => {
        const t = toDay(dateStr);
        return padL + ((t - t0) / tSpan) * chartW;
    };

    // Y-axis
    const allWeights = data.map(d => d.weight).filter(w => w > 0);
    if (initialWeight) allWeights.push(initialWeight);
    if (targetWeight) allWeights.push(targetWeight);

    const dataMin = Math.min(...allWeights);
    const dataMax = Math.max(...allWeights);
    const span = Math.max(dataMax - dataMin, 2);
    const pad = Math.max(2, span * 0.2);

    const yMin = Math.floor(dataMin - pad);
    const yMax = Math.ceil(dataMax + pad);
    const ySpan = yMax - yMin;

    const getY = (val) => {
        const v = isNaN(val) ? yMin : val;
        return padT + chartH - ((v - yMin) / ySpan) * chartH;
    };

    // Raw points
    const pts = data.map(d => ({
        x: getX(d.fullDate),
        y: getY(d.weight),
        w: d.weight,
        date: d.date,
        fullDate: d.fullDate,
        isInitial: d.isInitial,
        changeFromPrev: 0,
        changeFromInitial: d.weight - (initialWeight || d.weight)
    }));

    // Compute changes from previous
    for (let i = 0; i < pts.length; i++) {
        if (i > 0) pts[i].changeFromPrev = pts[i].w - pts[i-1].w;
    }

    // ---- 7-Day Moving Average ----
    const smoothed = pts.map((p, i) => {
        const windowSize = Math.min(7, pts.length);
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(pts.length, start + windowSize);
        const slice = pts.slice(start, end);
        const avg = slice.reduce((s, pt) => s + pt.w, 0) / slice.length;
        return { x: p.x, y: getY(avg) };
    });

    const rawLinePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const smoothLinePath = smoothed.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = pts.length > 1
        ? `${rawLinePath} L ${pts[pts.length-1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
        : '';

    // Y-axis labels
    const labelCount = 5;
    const yLabels = [];
    for (let i = 0; i <= labelCount; i++) {
        const val = yMin + (ySpan * i / labelCount);
        const rounded = Math.round(val * 10) / 10;
        if (!yLabels.includes(rounded)) yLabels.push(rounded);
    }

    // X-axis labels
    const fmtDate = (str) => {
        const d = new Date(String(str).substring(0, 10) + 'T12:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const xStart = fmtDate(rangeStart || data[0]?.fullDate);
    const xEnd = fmtDate(rangeEnd || data[data.length-1]?.fullDate);
    const midMs = t0 + tSpan / 2;
    const xMid = new Date(midMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Healthy zone
    const hzTop = minHealthy > 0 ? Math.max(padT, getY(Math.min(maxHealthy, yMax))) : 0;
    const hzBot = minHealthy > 0 ? Math.min(padT + chartH, getY(Math.max(minHealthy, yMin))) : 0;
    const hzHeight = hzBot - hzTop;
    const showHealthy = minHealthy > 0 && hzHeight > 2;

    // Path length for animation
    let pathLen = 0;
    for (let i = 1; i < pts.length; i++) {
        pathLen += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
    }

    const handlePointClick = (p, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            x: p.x,
            y: p.y,
            weight: p.w,
            date: p.date,
            changeFromPrev: p.changeFromPrev,
            changeFromInitial: p.changeFromInitial,
            isInitial: p.isInitial
        });
    };

    return (
        <div className={`w-full p-5 rounded-[2.5rem] ${styles.card} border ${styles.border} shadow-xl relative`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-black tracking-tight ${styles.textMain}`}>Weight Progress <span className="text-[10px] font-medium opacity-40">(kg)</span></h3>
                {targetWeight && (
                    <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Goal: {targetWeight}kg</span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" onClick={() => setTooltip(null)}>
                <defs>
                    <clipPath id="chartClip">
                        <rect x={padL - 6} y={0} width={chartW + 12} height={height} />
                    </clipPath>
                    <linearGradient id="wgFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Healthy BMI Zone */}
                {showHealthy && (
                    <rect x={padL} y={hzTop} width={chartW} height={hzHeight} fill={theme === 'dark' ? 'rgba(74,222,128,0.06)' : 'rgba(34,197,94,0.08)'} rx="4" />
                )}

                {/* Grid lines */}
                {yLabels.map((val, i) => {
                    const y = getY(val);
                    return (
                        <g key={i}>
                            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} />
                            <text x={padL - 4} y={y + 3} textAnchor="end" fill={theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)'} fontSize="8" fontWeight="700">{val % 1 === 0 ? val : val.toFixed(1)}</text>
                        </g>
                    );
                })}

                {/* Target weight line */}
                {targetWeight && (
                    <g>
                        <line x1={padL} y1={getY(targetWeight)} x2={width - padR} y2={getY(targetWeight)} stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" strokeDasharray="6 4" />
                        <text x={width - padR - 2} y={getY(targetWeight) - 4} textAnchor="end" fill="rgba(34,197,94,0.7)" fontSize="7" fontWeight="800">TARGET</text>
                    </g>
                )}

                {/* Clipped Data Area */}
                <g clipPath="url(#chartClip)">
                    {areaPath && <path d={areaPath} fill="url(#wgFill)" />}
                    
                    {/* 7-Day Moving Average (dashed) */}
                    {smoothed.length > 1 && (
                        <path
                            d={smoothLinePath}
                            fill="none"
                            stroke={theme === 'dark' ? '#93C5FD' : '#60A5FA'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4 3"
                            opacity="0.7"
                        />
                    )}

                    {/* Raw line */}
                    {pts.length > 1 && (
                        <path
                            d={rawLinePath}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={pathLen}
                            strokeDashoffset={pathLen}
                            style={{ animation: 'drawLine 1s ease-out forwards' }}
                            opacity="0.4"
                        />
                    )}

                    {/* Data points */}
                    {pts.map((p, i) => (
                        <circle 
                            key={i} 
                            cx={p.x} 
                            cy={p.y} 
                            r={p.isInitial ? 5 : 4} 
                            fill={p.isInitial ? (theme === 'dark' ? '#22D3EE' : '#06B6D4') : '#3B82F6'} 
                            stroke={theme === 'dark' ? '#1C1C1E' : '#FFFFFF'} 
                            strokeWidth="2" 
                            className="cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handlePointClick(p, e); }}
                        />
                    ))}
                </g>

                {/* X-axis labels */}
                <text x={padL} y={height - 4} textAnchor="start" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">{xStart}</text>
                <text x={padL + chartW / 2} y={height - 4} textAnchor="middle" fill={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} fontSize="8" fontWeight="600">{xMid}</text>
                <text x={width - padR} y={height - 4} textAnchor="end" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">{xEnd}</text>

                {/* Healthy zone label */}
                {showHealthy && (
                    <text x={width - padR - 4} y={hzTop + 10} textAnchor="end" fill={theme === 'dark' ? 'rgba(74,222,128,0.3)' : 'rgba(34,197,94,0.4)'} fontSize="6" fontWeight="800" letterSpacing="0.5">HEALTHY ZONE</text>
                )}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div 
                    className={`absolute z-10 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-md text-xs ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                    style={{ 
                        left: `${Math.min(Math.max((tooltip.x / width) * 100, 10), 80)}%`, 
                        top: `${Math.max((tooltip.y / height) * 100 - 15, 5)}%`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="font-black text-[11px] mb-0.5">{tooltip.date} {tooltip.isInitial && '(Start)'}</div>
                    <div className="font-bold text-blue-500">{tooltip.weight} kg</div>
                    {!tooltip.isInitial && (
                        <div className="mt-1 space-y-0.5 text-[9px] opacity-80">
                            {tooltip.changeFromPrev !== 0 && (
                                <div>vs prev: <span className={tooltip.changeFromPrev <= 0 ? 'text-green-500' : 'text-red-500'}>{tooltip.changeFromPrev > 0 ? '+' : ''}{tooltip.changeFromPrev.toFixed(1)} kg</span></div>
                            )}
                            {tooltip.changeFromInitial !== 0 && (
                                <div>vs start: <span className={tooltip.changeFromInitial <= 0 ? 'text-green-500' : 'text-red-500'}>{tooltip.changeFromInitial > 0 ? '+' : ''}{tooltip.changeFromInitial.toFixed(1)} kg</span></div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background: theme === 'dark' ? '#22D3EE' : '#06B6D4'}}></div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>Initial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>Logged</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0 border-t border-dashed" style={{borderColor: theme === 'dark' ? '#93C5FD' : '#60A5FA'}}></div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>7-Day Avg</span>
                </div>
                {targetWeight && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-0 border-t border-dashed border-green-500"></div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>Goal</span>
                    </div>
                )}
                {showHealthy && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/30"></div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>BMI 18.5–25</span>
                    </div>
                )}
            </div>

            <style>{`@keyframes drawLine { to { stroke-dashoffset: 0; } }`}</style>
        </div>
    );
};

export default WeightHistoryGraph;