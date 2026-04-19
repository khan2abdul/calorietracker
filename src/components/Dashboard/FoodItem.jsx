import React from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { THEMES } from '../../theme';

const emojiMap = {
    banana: '🍌', apple: '🍎', orange: '🍊', rice: '🍚', bread: '🍞',
    chicken: '🍗', egg: '🥚', milk: '🥛', coffee: '☕', tea: '🍵',
    water: '💧', juice: '🧃', salad: '🥗', fish: '🐟', beef: '🥩',
    pasta: '🍝', pizza: '🍕', burger: '🍔', sandwich: '🥪', soup: '🍲',
    yogurt: '🥛', cheese: '🧀', nuts: '🥜', fruit: '🍇', vegetable: '🥦',
    drink: '🥤', smoothie: '🥤', shake: '🥤', cereal: '🥣', oats: '🥣',
    default: '🍽️'
};

function getFoodEmoji(name) {
    if (!name) return emojiMap.default;
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (lower.includes(key)) return emoji;
    }
    return emojiMap.default;
}

export const FoodItem = ({ food, theme, onClick }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const emoji = food.emoji || getFoodEmoji(food.name);

    return (
        <div
            onClick={() => onClick(food)}
            className={`p-3.5 px-4 flex items-center gap-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] select-none ${theme === 'dark' ? 'bg-[#0a0a0a] border border-white/5' : 'bg-gray-50 border border-gray-100'}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(food); }}
        >
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${styles.textMain}`}>{food.name}</div>
                {food.weight && <div className={`text-xs ${styles.textSec}`}>{food.weight}</div>}
                <div className="flex gap-1.5 mt-1.5">
                    {food.protein > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            P {food.protein}g
                        </span>
                    )}
                    {food.carbs > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                            C {food.carbs}g
                        </span>
                    )}
                    {food.fat > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                            F {food.fat}g
                        </span>
                    )}
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className={`text-base font-bold ${styles.textMain}`}>{food.calories}</div>
                <div className={`text-[10px] ${styles.textSec}`}>kcal</div>
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
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-blue-50 border-blue-100'}`}>
                        <p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>Protein</p>
                        <p className={`text-xl font-bold ${styles.textMain}`}>{food.protein}g</p>
                    </div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-emerald-500'}`}>Carbs</p>
                        <p className={`text-xl font-bold ${styles.textMain}`}>{food.carbs}g</p>
                    </div>
                    <div className={`p-4 rounded-2xl text-center border ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-orange-50 border-orange-100'}`}>
                        <p className={`text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`}>Fat</p>
                        <p className={`text-xl font-bold ${styles.textMain}`}>{food.fat}g</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { onEdit(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-slate-700'}`}><Edit2 size={18} /> Edit</button>
                    <button onClick={() => { onDelete(food); onClose(); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-[#FF453A]/10 text-[#FF453A]' : 'bg-red-50 text-red-600'}`}><Trash2 size={18} /> Delete</button>
                </div>
            </div>
        </div>
    );
};
