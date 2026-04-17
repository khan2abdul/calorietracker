import React from 'react';
import { Flame, CheckSquare, Square, X, Edit2, Trash2 } from 'lucide-react';
import { THEMES } from '../../theme';
import { MacroDonutChart } from './MealMacroSummary';

export const FoodItem = ({ food, theme, isSelectionMode, isSelected, onClick, onToggleSelect }) => {
    const isHighCalorie = food.calories > 500;
    const styles = THEMES[theme] || THEMES.dark;

    return (
        <div
            onClick={() => isSelectionMode ? onToggleSelect(food) : onClick(food)}
            className={`
          relative p-4 flex justify-between items-center transition-all duration-200 ease-out rounded-xl border mb-3 cursor-pointer
          ${isHighCalorie
                    ? (theme === 'dark' ? 'bg-[#1C1C1E] border-red-500/50' : 'bg-red-50 border-red-100')
                    : styles.bg + ' ' + styles.border}
      `}
        >
            <div className="flex items-center gap-3">
                {isSelectionMode && (
                    <div className={`mr-1 transition-all ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                        {isSelected ? <CheckSquare size={20} className="text-current" /> : <Square size={20} />}
                    </div>
                )}

                <div className={`flex items-center justify-center w-8 h-8 rounded-full overflow-hidden shrink-0 ${isHighCalorie
                    ? (theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-100')
                    : (theme === 'dark' ? 'bg-green-500/10' : (theme === 'wooden' ? 'bg-[#556B2F]/20' : 'bg-emerald-100'))
                    }`}>
                    {isHighCalorie ? (
                        <Flame size={16} color="#FF453A" fill="currentColor" className="animate-pulse" />
                    ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${theme === 'wooden' ? 'bg-[#556B2F]' : (theme === 'dark' ? 'bg-green-500' : 'bg-emerald-600')}`} />
                    )}
                </div>

                <div className="flex flex-col">
                    <span className={`text-base font-semibold ${isHighCalorie ? 'text-[#FF3B30]' : styles.textMain}`}>{food.name}</span>
                    {food.weight && <span className={`text-xs ${styles.textSec}`}>{food.weight}</span>}
                </div>
            </div>

            <div className="flex flex-col items-end justify-center h-full">
                <span className={`text-sm font-bold ${isHighCalorie ? 'text-[#FF3B30]' : styles.textSec}`}>
                    {food.calories}
                </span>
            </div>
        </div>
    );
};

export const FoodDetailModal = ({ food, theme, onClose, onEdit, onDelete }) => {
    if (!food) return null;
    const styles = THEMES[theme] || THEMES.dark;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl transform transition-all scale-100 border ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-2xl font-bold ${styles.textMain}`}>{food.name}</h2>
                        <p className={`font-medium text-sm ${styles.textSec}`}>{food.weight || '1 Serving'} • {food.meal}</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${styles.bg} ${styles.textSec}`}><X size={20} /></button>
                </div>
                <div className="flex flex-col items-center mb-8">
                    <MacroDonutChart protein={food.protein} carbs={food.carbs} fat={food.fat} theme={theme} />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-blue-50 border-blue-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#3E2723]' : (theme === 'dark' ? 'text-blue-400' : 'text-blue-500')}`}>Protein</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.protein}g</p></div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-emerald-50 border-emerald-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#556B2F]' : (theme === 'dark' ? 'text-green-400' : 'text-emerald-500')}`}>Carbs</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.carbs}g</p></div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : (theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-orange-50 border-orange-100')}`}><p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'wooden' ? 'text-[#8B4513]' : (theme === 'dark' ? 'text-orange-400' : 'text-orange-500')}`}>Fat</p><p className={`text-xl font-bold ${styles.textMain}`}>{food.fat}g</p></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { onEdit(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-slate-700'}`}><Edit2 size={18} /> Edit</button>
                    <button onClick={() => { onDelete(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#FF453A]/10 text-[#FF453A]' : 'bg-red-50 text-red-600'}`}><Trash2 size={18} /> Delete</button>
                </div>
            </div>
        </div>
    );
};
