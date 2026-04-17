import React, { useMemo } from 'react';
import { THEMES } from '../../theme';

export const MacroDonutChart = ({ protein, carbs, fat, size = 160, theme }) => {
    const p = protein || 0; const c = carbs || 0; const f = fat || 0;
    const total = p + c + f || 1;
    const radius = (size - 20) / 2;
    const circumference = radius * 2 * Math.PI;
    const styles = THEMES[theme] || THEMES.dark;

    const pOffset = 0;
    const cOffset = -((p / total) * circumference);
    const fOffset = -(((p + c) / total) * circumference);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.ringTrack} strokeWidth="20" fill="transparent" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.p} strokeWidth="20" fill="transparent" strokeDasharray={`${(p / total) * circumference} ${circumference}`} strokeDashoffset={pOffset} />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.c} strokeWidth="20" fill="transparent" strokeDasharray={`${(c / total) * circumference} ${circumference}`} strokeDashoffset={cOffset} />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.chart.f} strokeWidth="20" fill="transparent" strokeDasharray={`${(f / total) * circumference} ${circumference}`} strokeDashoffset={fOffset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xs font-bold uppercase ${styles.textSec}`}>Total</span>
                <span className={`text-2xl font-bold ${styles.textMain}`}>{Math.round((p * 4) + (c * 4) + (f * 9))}</span>
                <span className={`text-[10px] ${styles.textSec}`}>kcal</span>
            </div>
        </div>
    );
};

const MealMacroSummary = ({ foods, theme }) => {
    const stats = useMemo(() => {
        if (!foods) return { cals: 0, pro: 0, carb: 0, fat: 0 };
        return foods.reduce((acc, item) => ({
            cals: acc.cals + (item.calories || 0),
            pro: acc.pro + (item.protein || 0),
            carb: acc.carb + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });
    }, [foods]);

    if (stats.cals === 0) return null;

    const totalGrams = stats.pro + stats.carb + stats.fat || 1;
    const pPct = (stats.pro / totalGrams) * 100;
    const cPct = (stats.carb / totalGrams) * 100;
    const fPct = (stats.fat / totalGrams) * 100;

    const styles = THEMES[theme] || THEMES.dark;

    return (
        <div className={`mt-2 mb-4 p-3 rounded-xl border animate-fade-in ${styles.bg} ${styles.border}`}>
            <div className={`flex h-2 w-full rounded-full overflow-hidden mb-2 ${theme === 'dark' ? 'bg-[#2C2C2E]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-white')}`}>
                <div style={{ width: `${pPct}%`, backgroundColor: styles.chart.p }} className="transition-all duration-500" />
                <div style={{ width: `${cPct}%`, backgroundColor: styles.chart.c }} className="transition-all duration-500" />
                <div style={{ width: `${fPct}%`, backgroundColor: styles.chart.f }} className="transition-all duration-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold tracking-wide">
                <div className="flex items-center gap-1.5 justify-start">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.p }}></div>
                    <span className={styles.textSec}>{stats.pro.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.c }}></div>
                    <span className={styles.textSec}>{stats.carb.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.chart.f }}></div>
                    <span className={styles.textSec}>{stats.fat.toFixed(0)}g</span>
                </div>
            </div>
        </div>
    )
};

export default MealMacroSummary;
