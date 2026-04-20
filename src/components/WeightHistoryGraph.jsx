import React from 'react';
import { THEMES } from '../theme';

const WeightHistoryGraph = ({ data, theme, userStats, rangeStart, rangeEnd }) => {
    const height = 220;
    const width = 340;
    const padL = 36; // left padding for Y labels
    const padR = 10;
    const padT = 14;
    const padB = 24; // bottom for X labels
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const styles = THEMES[theme];

    const initialWeight = userStats?.initialWeight;
    const targetWeight = userStats?.targetWeight;
    const userHeight = (userStats?.height || 0) / 100;

    // Healthy BMI range
    const minHealthy = userHeight > 0 ? Math.round(18.5 * userHeight * userHeight) : 0;
    const maxHealthy = userHeight > 0 ? Math.round(25 * userHeight * userHeight) : 0;

    // ---- Safe date parsing: strip everything after YYYY-MM-DD ----
    const toDay = (str) => {
        if (!str) return 0;
        const clean = String(str).substring(0, 10); // "YYYY-MM-DD"
        return new Date(clean + 'T12:00:00').getTime(); // noon avoids DST edge
    };

    // X-axis (time-based)
    const t0 = rangeStart ? toDay(rangeStart) : toDay(data[0]?.fullDate);
    const t1 = rangeEnd   ? toDay(rangeEnd)   : toDay(data[data.length - 1]?.fullDate);
    const tSpan = Math.max(1, t1 - t0);

    const getX = (dateStr) => {
        const t = toDay(dateStr);
        return padL + ((t - t0) / tSpan) * chartW;
    };

    // Y-axis — tight around the journey
    const allWeights = data.map(d => d.weight).filter(w => w > 0);
    if (initialWeight) allWeights.push(initialWeight);
    if (targetWeight) allWeights.push(targetWeight);

    const dataMin = Math.min(...allWeights);
    const dataMax = Math.max(...allWeights);
    const span = Math.max(dataMax - dataMin, 2); // at least 2kg visible
    const pad = Math.max(2, span * 0.2); // 20% breathing room, min 2kg

    const yMin = Math.floor(dataMin - pad);
    const yMax = Math.ceil(dataMax + pad);
    const ySpan = yMax - yMin;

    const getY = (val) => {
        const v = isNaN(val) ? yMin : val;
        return padT + chartH - ((v - yMin) / ySpan) * chartH;
    };

    // Path helpers
    const pts = data.map(d => ({ x: getX(d.fullDate), y: getY(d.weight), w: d.weight, date: d.date, isInitial: d.isInitial }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = pts.length > 1
        ? `${linePath} L ${pts[pts.length-1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
        : '';

    // Y-axis labels (deduplicated)
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
    const xEnd   = fmtDate(rangeEnd || data[data.length-1]?.fullDate);
    // Midpoint
    const midMs = t0 + tSpan / 2;
    const midDate = new Date(midMs);
    const xMid = midDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Clamp healthy zone to visible area
    const hzTop = minHealthy > 0 ? Math.max(padT, getY(Math.min(maxHealthy, yMax))) : 0;
    const hzBot = minHealthy > 0 ? Math.min(padT + chartH, getY(Math.max(minHealthy, yMin))) : 0;
    const hzHeight = hzBot - hzTop;
    const showHealthy = minHealthy > 0 && hzHeight > 2;

    // Estimated path length for animation
    let pathLen = 0;
    for (let i = 1; i < pts.length; i++) {
        pathLen += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
    }

    return (
        <div className={`w-full p-5 rounded-[2.5rem] ${styles.card} border ${styles.border} shadow-xl`}>
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
            <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
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
                    <rect
                        x={padL} y={hzTop}
                        width={chartW} height={hzHeight}
                        fill={theme === 'dark' ? 'rgba(74,222,128,0.06)' : 'rgba(34,197,94,0.08)'}
                        rx="4"
                    />
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
                    {/* Area + Line */}
                    {areaPath && <path d={areaPath} fill="url(#wgFill)" />}
                    {pts.length > 1 && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={pathLen}
                            strokeDashoffset={pathLen}
                            style={{ animation: 'drawLine 1s ease-out forwards' }}
                        />
                    )}

                    {/* Data points */}
                    {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={p.isInitial ? 5 : 4} fill={p.isInitial ? (theme === 'dark' ? '#22D3EE' : '#06B6D4') : '#3B82F6'} stroke={theme === 'dark' ? '#1C1C1E' : '#FFFFFF'} strokeWidth="2" />
                    ))}
                </g>

                {/* Labels overlay (Not Clipped) */}
                {pts.map((p, i) => {
                    if (i !== 0 && i !== pts.length - 1) return null;
                    let yOffset = -10;
                    
                    if (pts.length > 1 && (i === 0 || i === pts.length - 1)) {
                        const dx = Math.abs(pts[0].x - pts[pts.length - 1].x);
                        const dy = Math.abs(pts[0].y - pts[pts.length - 1].y);
                        if (dx < 30 && dy < 20) {
                            if (pts[0].y <= pts[pts.length - 1].y) {
                                yOffset = i === 0 ? -12 : 16;
                            } else {
                                yOffset = i === 0 ? 16 : -12;
                            }
                        }
                    }

                    let textX = p.x;
                    let textAnchor = "middle";
                    let prefix = "";

                    // Pin the label to the left border if it went off screen
                    if (p.x < padL) {
                        textX = padL + 4;
                        textAnchor = "start";
                        prefix = "Start: ";
                    } else if (p.isInitial) {
                        prefix = "Start: ";
                    }

                    const tColor = p.isInitial ? (theme === 'dark' ? '#67E8F9' : '#0891B2') : (theme === 'dark' ? '#93C5FD' : '#2563EB');

                    return (
                        <text key={`lbl-${i}`} x={textX} y={Math.max(10, p.y + yOffset)} textAnchor={textAnchor} fill={tColor} fontSize="9" fontWeight="800">
                            {prefix}{p.w}kg
                        </text>
                    );
                })}

                {/* X-axis labels */}
                <text x={padL} y={height - 4} textAnchor="start" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">{xStart}</text>
                <text x={padL + chartW / 2} y={height - 4} textAnchor="middle" fill={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} fontSize="8" fontWeight="600">{xMid}</text>
                <text x={width - padR} y={height - 4} textAnchor="end" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">{xEnd}</text>

                {/* Healthy zone label */}
                {showHealthy && (
                    <text x={width - padR - 4} y={hzTop + 10} textAnchor="end" fill={theme === 'dark' ? 'rgba(74,222,128,0.3)' : 'rgba(34,197,94,0.4)'} fontSize="6" fontWeight="800" letterSpacing="0.5">HEALTHY ZONE</text>
                )}
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-5 mt-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background: theme === 'dark' ? '#22D3EE' : '#06B6D4'}}></div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>Initial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>Logged</span>
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

            {/* Draw animation keyframes */}
            <style>{`
                @keyframes drawLine {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};

export default WeightHistoryGraph;
