import React from 'react';
import { THEMES, GRAPH_COLORS } from '../theme';

const EnergyHistoryGraph = ({ data, theme, viewMode }) => {
    const height = 220;
    const width = 340;
    const padL = 36;
    const padR = 30; // Extra room for right-aligned end-labels
    const padT = 20; 
    const padB = 24;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const styles = THEMES[theme];
    const colors = GRAPH_COLORS[theme];

    // Get active keys based on view format
    const activeKeys = viewMode === 'combined' ? ['consumed', 'burned', 'net'] : [viewMode];

    // Calculate dynamic min/max based on actual data
    let dataMin = 0;
    let dataMax = 10; 

    if (data && data.length > 0) {
        const allVals = data.flatMap(d => activeKeys.map(k => d[k]));
        dataMin = Math.min(0, ...allVals); 
        dataMax = Math.max(...allVals);
    }
    
    // Add 20% padding to the max
    const yMax = Math.ceil(dataMax * 1.20) || 2000;
    const yMin = viewMode === 'net' ? Math.floor(dataMin * 1.20) || -500 : 0;
    const ySpan = Math.max(1, yMax - yMin);

    const getY = (val) => padT + chartH - (((isNaN(val) ? 0 : val) - yMin) / ySpan) * chartH;
    
    // X-axis setup
    const getX = (index) => padL + (index / Math.max(1, data.length - 1)) * chartW;

    // Helper to generate bezier curved path strings
    const makePath = (key) => {
        if (!data || data.length === 0) return "";
        let p = `M ${getX(0).toFixed(1)} ${getY(data[0][key]).toFixed(1)}`;
        for(let i = 0; i < data.length - 1; i++) {
            const currX = getX(i);
            const currY = getY(data[i][key]);
            const nextX = getX(i+1);
            const nextY = getY(data[i+1][key]);
            const midX = (currX + nextX)/2;
            p += ` C ${midX.toFixed(1)} ${currY.toFixed(1)}, ${midX.toFixed(1)} ${nextY.toFixed(1)}, ${nextX.toFixed(1)} ${nextY.toFixed(1)}`;
        }
        return p;
    };

    // Label generation
    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        yLabels.push(Math.round(yMin + (ySpan * i / steps)));
    }

    return (
        <div className={`w-full p-5 rounded-[2.5rem] ${styles.card} border ${styles.border} shadow-xl`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-black tracking-tight ${styles.textMain}`}>Energy History <span className="text-[10px] font-medium opacity-40">(kcal)</span></h3>
            </div>

            {/* SVG Chart */}
            <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <defs>
                    <clipPath id="revealMaskEnergy">
                        <rect x={0} y={0} width="100%" height={height} className="reveal-anim" />
                    </clipPath>
                    <style>{`
                        @keyframes revealLineEnergy {
                            from { width: 0; }
                            to { width: 100%; }
                        }
                        .reveal-anim { animation: revealLineEnergy 1.2s ease-out forwards; }
                    `}</style>
                </defs>

                {/* Horizontal Grid */}
                {yLabels.map((val, i) => {
                    const y = getY(val);
                    return (
                        <g key={i}>
                            <line x1={padL} y1={y} x2={width - padR + 25} y2={y} stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
                            <text x={padL - 4} y={y + 3} textAnchor="end" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">
                                {Math.abs(val) >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}
                            </text>
                        </g>
                    );
                })}

                {/* Draw zero line stronger if there are negative numbers */}
                {yMin < 0 && (
                    <line x1={padL} y1={getY(0)} x2={width - padR + 25} y2={getY(0)} stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'} strokeWidth="1.5" />
                )}

                <g clipPath="url(#revealMaskEnergy)">
                    {/* Animated Lines */}
                    {activeKeys.map(k => (
                        <path 
                            key={`path-${k}`}
                            d={makePath(k)} 
                            fill="none" 
                            stroke={colors[k]} 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeDasharray={k === 'net' ? '5 5' : 'none'}
                            opacity={k === 'burned' ? 0.9 : 1}
                        />
                    ))}

                    {/* Data Points */}
                    {activeKeys.map(k => (
                        <g key={`points-${k}`}>
                            {data.map((d, i) => {
                                const isEmpty = d.consumed === 0 && d.burned === 0;
                                const isNet = k === 'net';
                                return (
                                    <circle 
                                        key={`pt-${i}-${k}`} 
                                        cx={getX(i)} 
                                        cy={getY(d[k])} 
                                        r={isNet ? 4.5 : 3.5} 
                                        fill={isNet ? (theme === 'dark' ? '#1C1C1E' : '#FFFFFF') : colors[k]} 
                                        stroke={isNet ? colors[k] : (theme === 'dark' ? '#1C1C1E' : '#FFFFFF')} 
                                        strokeWidth={isNet ? "2" : "1"}
                                        opacity={isEmpty ? 0.2 : 1}
                                    />
                                );
                            })}
                        </g>
                    ))}
                </g>

                {/* Staggered Labels overlay on final point */}
                {(() => {
                    if (!data || data.length === 0) return null;
                    const labels = [];
                    activeKeys.forEach((k) => {
                        const val = data[data.length - 1][k];
                        if (typeof val === 'number') {
                            labels.push({ key: k, y: getY(val), val, color: colors[k] });
                        }
                    });
                    
                    labels.sort((a, b) => a.y - b.y);
                    
                    if (labels.length === 3) {
                        if (Math.abs(labels[0].y - labels[1].y) < 12 && Math.abs(labels[1].y - labels[2].y) < 12) {
                            let mid = labels[1].y;
                            labels[0].y = mid - 12;
                            labels[1].y = mid;
                            labels[2].y = mid + 12;
                        } else if (Math.abs(labels[0].y - labels[1].y) < 12) {
                            let overlap = (labels[0].y + labels[1].y) / 2;
                            labels[0].y = overlap - 6;
                            labels[1].y = overlap + 6;
                        } else if (Math.abs(labels[1].y - labels[2].y) < 12) {
                            let overlap = (labels[1].y + labels[2].y) / 2;
                            labels[1].y = overlap - 6;
                            labels[2].y = overlap + 6;
                        }
                    } else if (labels.length === 2 && Math.abs(labels[0].y - labels[1].y) < 12) {
                        let overlap = (labels[0].y + labels[1].y) / 2;
                        labels[0].y = overlap - 6;
                        labels[1].y = overlap + 6;
                    }

                    return labels.map(lbl => (
                        <text key={`lbl-${lbl.key}`} x={getX(data.length - 1) + 8} y={lbl.y + 3} textAnchor="start" fill={lbl.color} fontSize="10" fontWeight="900">
                            {Math.round(lbl.val)}
                        </text>
                    ));
                })()}

                {/* X-axis labels */}
                {data && data.length > 0 && (
                    <>
                        <text x={padL} y={height - 4} textAnchor="start" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">
                            {data[0].date}
                        </text>
                        {data.length > 2 && (
                            <text x={padL + chartW/2} y={height - 4} textAnchor="middle" fill={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} fontSize="8" fontWeight="600">
                                {data[Math.floor(data.length/2)].date}
                            </text>
                        )}
                        <text x={width - padR} y={height - 4} textAnchor="end" fill={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'} fontSize="8" fontWeight="700">
                            {data[data.length - 1].date}
                        </text>
                    </>
                )}
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 flex-wrap">
                {activeKeys.map(k => (
                    <div key={`legend-${k}`} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${k === 'net' ? 'border-[1.5px]' : ''}`} style={{ background: k === 'net' ? 'transparent' : colors[k], borderColor: colors[k] }}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textSec}`}>{k}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EnergyHistoryGraph;
