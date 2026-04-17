import React from 'react';
import { X, TrendingUp, TrendingDown, Droplets, PieChart, Activity } from 'lucide-react';
import { THEMES } from '../../theme';

const DailyDetailModal = ({ isOpen, onClose, totals, goal, water, burned, theme }) => {
    if (!isOpen) return null;
    const styles = THEMES[theme] || THEMES.dark;
    
    const remaining = Math.max(0, goal - totals.cals);
    const isOver = totals.cals > goal;
    const netCalories = totals.cals - burned;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            
            <div className={`relative w-full max-w-sm rounded-[2.5rem] overflow-hidden border ${styles.card} ${styles.border} shadow-2xl transform transition-all scale-100`}>
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h2 className={`text-xl font-black ${styles.textMain}`}>Daily Breakdown</h2>
                    <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-[#888] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pb-8 overflow-y-auto max-h-[70vh]">
                    {/* Calories Highlight */}
                    <div className={`p-5 rounded-3xl mb-4 bg-gradient-to-br transition-all ${isOver ? 'from-red-500/20 to-orange-500/5 border-red-500/20' : 'from-green-500/20 to-emerald-500/5 border-green-500/20'} border`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Calories</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isOver ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                {isOver ? 'Over' : 'Under'}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black">{Math.abs(netCalories)}</span>
                            <span className="text-sm font-bold opacity-60 uppercase">kcal</span>
                        </div>
                        <p className="text-[11px] font-bold mt-2 opacity-50 leading-tight">
                            Consumed {totals.cals} kcal and burned {burned} kcal today.
                        </p>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-3">
                        <DetailItem 
                            label="Consumed" 
                            value={`${totals.cals} kcal`} 
                            icon={<TrendingUp size={16} />} 
                            color="#34C759" 
                            theme={theme}
                            progress={(totals.cals / goal) * 100}
                        />
                        <DetailItem 
                            label="Burned" 
                            value={`${burned} kcal`} 
                            icon={<Activity size={16} />} 
                            color="#FF453A" 
                            theme={theme}
                            progress={(burned / 1000) * 100}
                        />
                        <DetailItem 
                            label="Water Intake" 
                            value={`${(water / 1000).toFixed(1)}L`} 
                            icon={<Droplets size={16} />} 
                            color="#0A84FF" 
                            theme={theme}
                            progress={(water / 3000) * 100}
                        />
                    </div>

                    {/* Macros Recap */}
                    <div className={`mt-6 p-5 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-[#888]" />
                            <span className={`text-xs font-black uppercase tracking-wider ${styles.textSec}`}>Macro Split</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-[#888] mb-0.5">CARBS</p>
                                <p className={`text-sm font-black ${styles.textMain}`}>{totals.carb}g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-[#888] mb-0.5">PRO</p>
                                <p className={`text-sm font-black ${styles.textMain}`}>{totals.pro}g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-[#888] mb-0.5">FAT</p>
                                <p className={`text-sm font-black ${styles.textMain}`}>{totals.fat}g</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, icon, color, theme, progress }) => {
    const styles = THEMES[theme] || THEMES.dark;
    return (
        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#1e1e1e] border-white/5' : 'bg-white border-gray-100 flex flex-col gap-2'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
                        {icon}
                    </div>
                    <span className={`text-[13px] font-bold ${styles.textMain}`}>{label}</span>
                </div>
                <span className={`text-[13px] font-black ${styles.textMain}`}>{value}</span>
            </div>
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

export default DailyDetailModal;
