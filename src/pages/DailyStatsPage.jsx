import React from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import { THEMES } from '../theme';
import { calculateTDEE } from '../utils';

const DailyStatsPage = ({ totals, goal, burnMetrics, theme, userStats, onBack }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const { totalBurned } = burnMetrics;
    const tdee = Math.round(calculateTDEE(userStats));
    const deficit = tdee - totals.cals + totalBurned;

    return (
        <div className={`min-h-screen animate-fade-in pb-32 ${styles.bg}`}>
            {/* Header Area */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between">
                <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90 ${styles.card} ${styles.border}`}>
                    <ChevronLeft size={20} className={styles.textMain} />
                </button>
                <h1 className={`text-xl font-black tracking-tight ${styles.textMain}`}>Daily Insights</h1>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${styles.card} ${styles.border} opacity-20`}>
                    <Info size={18} />
                </div>
            </div>

            <div className="px-6 space-y-6 max-w-lg mx-auto">
                
                {/* 1. HERO CARD ONLY */}
                <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all shadow-xl ${deficit >= 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/20' : 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-500/20'}`}>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Caloric Impact</span>
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${deficit >= 0 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-red-500 text-white'}`}>
                            {deficit >= 0 ? 'Deficit' : 'Surplus'}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className={`text-6xl font-black tracking-tighter ${styles.textMain}`}>{Math.abs(deficit)}</span>
                        <span className="text-xl font-bold opacity-60">kcal</span>
                    </div>

                    <p className={`text-sm font-medium mt-4 leading-relaxed ${styles.textSec}`}>
                        {deficit >= 0 
                            ? "You're in a healthy deficit! Your body is using stored energy." 
                            : "You're in a surplus today. This energy will be stored for later use."}
                    </p>

                    {/* Formula Row */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-x-2 gap-y-1 text-[12px] font-bold" style={{ color: '#888' }}>
                        <span>TDEE</span> <span style={{ color: '#0A84FF' }}>{tdee}</span>
                        <span>−</span>
                        <span>Eaten</span> <span style={{ color: '#34C759' }}>{totals.cals}</span>
                        <span>+</span>
                        <span>Burned</span> <span style={{ color: '#FF9F0A' }}>{totalBurned}</span>
                        <span>=</span>
                        <span style={{ color: deficit >= 0 ? '#34C759' : '#FF453A' }}>{deficit} kcal</span>
                    </div>
                </div>

                {/* Motivational Placeholder */}
                <div className="pt-10 text-center px-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-30 leading-relaxed" style={{ color: '#aaa' }}>
                        Focus on the balance.<br/>Consistency leads to results.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DailyStatsPage;
