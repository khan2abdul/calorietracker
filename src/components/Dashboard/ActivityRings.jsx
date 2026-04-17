import React, { useState, useEffect } from 'react';
import { THEMES } from '../../theme';

export const CircularProgress = ({ value, max, size = 150, strokeWidth = 12, theme = 'dark' }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const [displayVal, setDisplayVal] = useState(0);
    const safeValue = isNaN(value) ? 0 : value;
    const safeMax = isNaN(max) ? 2000 : max;
    const remaining = Math.max(0, safeMax - safeValue);
    const isOver = safeValue > safeMax;

    useEffect(() => {
        let start = 0;
        const end = remaining;
        const duration = 800;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setDisplayVal(Math.round(start + (end - start) * easeProgress));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [remaining]);

    const progress = Math.min(safeValue / safeMax, 1);
    const dashoffset = circumference - progress * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={styles.ringTrack} strokeWidth={strokeWidth} fill="transparent" />
                <circle 
                    cx={size / 2} cy={size / 2} r={radius} 
                    stroke={isOver ? "#FF453A" : "#34C759"} 
                    strokeWidth={strokeWidth} fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={circumference} 
                    strokeLinecap="round" 
                    className="animate-ring-fill"
                    style={{ '--target-offset': dashoffset }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className={`hero-text leading-none ${styles.textMain}`}>{displayVal}</span>
                <span className={`text-[11px] font-bold mt-1 uppercase ${styles.textSec}`} style={{ letterSpacing: '2px' }}>{isOver ? "Over Goal" : "Remaining"}</span>
            </div>
        </div>
    );
};

const ActivityRings = ({ food, burn, water, theme = 'dark', onClick }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const size = 150;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const foodMax = food.max || 2200;
    const burnMax = burn.max || 1000;
    const waterMax = water.max || 3000;

    const isOver = food.current > foodMax;
    const remaining = Math.max(0, foodMax - food.current);
    
    const [displayVal, setDisplayVal] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = Math.round(remaining);
        const duration = 800;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setDisplayVal(Math.round(start + (end - start) * easeProgress));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [remaining]);

    const foodPct = Math.min(food.current / foodMax, 1);
    const burnPct = Math.min(burn.current / burnMax, 1);
    const waterPct = Math.min(water.current / waterMax, 1);

    const foodOff = circumference - (foodPct * circumference);
    const burnOff = circumference - (burnPct * circumference);
    const waterOff = circumference - (waterPct * circumference);

    return (
        <div 
            onClick={onClick}
            className="relative flex flex-col items-center justify-center w-full"
        >
            <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90 relative z-10 overflow-visible">
                    <circle cx={size/2} cy={size/2} r={radius} stroke={styles.ringTrack} strokeWidth={strokeWidth} fill="transparent" />
                    <circle cx={size/2} cy={size/2} r={radius} stroke={styles.chart.p} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference} strokeLinecap="round" className="animate-ring-fill" style={{ '--target-offset': waterOff, opacity: 0.3 }} />
                    <circle cx={size/2} cy={size/2} r={radius} stroke={styles.chart.f} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference} strokeLinecap="round" className="animate-ring-fill" style={{ '--target-offset': burnOff, opacity: 0.5 }} />
                    <circle cx={size/2} cy={size/2} r={radius} stroke={isOver ? "#FF453A" : "#34C759"} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference} strokeLinecap="round" className="animate-ring-fill" style={{ '--target-offset': foodOff }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <span className={`hero-text leading-none ${styles.textMain}`}>
                        {displayVal}
                    </span>
                    <span className={`text-[11px] font-bold mt-1 uppercase ${styles.textSec}`} style={{ letterSpacing: '2px' }}>{isOver ? "Over Goal" : "Remaining"}</span>
                </div>
            </div>
            
            <div className="mt-2.5 flex flex-col items-center">
                <div className="flex items-center justify-center">
                    <span className={`title-text ${styles.textMain}`}>{food.current}</span>
                    <span className={`text-[11px] font-medium ml-1 uppercase ${styles.textSec}`}>/ {foodMax} kcal</span>
                </div>
                
                <div className="flex items-center gap-3.5 mt-1.5 opacity-80">
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></div>
                        <span className={`caption-text font-bold ${styles.textSec}`}>Eaten</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: styles.chart.f }}></div>
                        <span className={`caption-text font-bold ${styles.textSec}`}>Burned</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: styles.chart.p }}></div>
                        <span className={`caption-text font-bold ${styles.textSec}`}>Water</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityRings;
