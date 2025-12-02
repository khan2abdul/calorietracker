import React from 'react';
import { THEMES, GRAPH_COLORS } from '../theme';

const EnergyHistoryGraph = ({ data, theme, viewMode }) => {
    const height = 220;
    const width = 340;
    const padding = 20;
    const styles = THEMES[theme];
    const colors = GRAPH_COLORS[theme];

    let maxVal = 3000;
    let minVal = -500;
    if (viewMode === 'burned') { maxVal = 1500; minVal = 0; }
    else if (viewMode === 'net') { maxVal = 2000; minVal = -1000; }

    const range = maxVal - minVal;
    const getY = (val) => height - padding - (((val - minVal) / range) * (height - (padding * 2)));
    const getX = (index) => padding + (index * ((width - (padding * 2)) / (data.length - 1)));
    const makePath = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ');

    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) yLabels.push(minVal + (range * (i / steps)));

    return (
        <div className={`w-full p-4 rounded-3xl ${styles.card} border ${styles.border}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`font-bold ${styles.textMain}`}>Energy History <span className="text-xs font-normal opacity-60">(kcal)</span></h3>
            </div>
            <div className="relative h-[220px] w-full">
                {yLabels.map((val, i) => (
                    <div key={i} className="absolute w-full flex items-center" style={{ top: getY(val) }}>
                        <span className={`text-[9px] w-8 text-right pr-2 ${styles.textSec}`}>{val >= 1000 ? (val / 1000).toFixed(1) + 'K' : Math.round(val)}</span>
                        <div className={`flex-1 h-px ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700/20'}`}></div>
                    </div>
                ))}
                <svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`} className="absolute top-0 left-0 overflow-visible pl-8">
                    {(viewMode === 'combined' || viewMode === 'consumed') && <path d={makePath('consumed')} fill="none" stroke={colors.consumed} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    {(viewMode === 'combined' || viewMode === 'burned') && <path d={makePath('burned')} fill="none" stroke={colors.burned} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    {(viewMode === 'combined' || viewMode === 'net') && <path d={makePath('net')} fill="none" stroke={colors.net} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                <div className={`absolute bottom-0 left-8 right-0 flex justify-between text-[10px] pt-2 ${styles.textSec}`}>
                    <span>{data[0].date}</span>
                    <span>{data[data.length - 1].date}</span>
                </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 flex-wrap">
                {(viewMode === 'combined' || viewMode === 'consumed') && <div className="flex items-center gap-2"><div className="w-3 h-1 rounded-full" style={{ background: colors.consumed }}></div><span className={`text-xs ${styles.textSec}`}>Consumed</span></div>}
                {(viewMode === 'combined' || viewMode === 'burned') && <div className="flex items-center gap-2"><div className="w-3 h-1 rounded-full" style={{ background: colors.burned }}></div><span className={`text-xs ${styles.textSec}`}>Burned</span></div>}
                {(viewMode === 'combined' || viewMode === 'net') && <div className="flex items-center gap-2"><div className="w-3 h-1 rounded-full" style={{ background: colors.net }}></div><span className={`text-xs ${styles.textSec}`}>Net</span></div>}
            </div>
        </div>
    );
};

export default EnergyHistoryGraph;
