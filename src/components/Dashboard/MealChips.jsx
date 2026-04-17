import React from 'react';

const MealChips = ({ logs, onMealClick }) => {
    const meals = [
        { name: 'Breakfast', icon: '🌅' },
        { name: 'Lunch', icon: '☀️' },
        { name: 'Dinner', icon: '🌙' },
        { name: 'Snacks', icon: '🍎' }
    ];
    
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {meals.map(meal => {
                const logsForMeal = logs[meal.name] || [];
                const kcal = logsForMeal.reduce((acc, f) => acc + (f.calories || 0), 0) || 0;
                const hasData = logsForMeal.length > 0;
                
                return (
                    <button
                        key={meal.name}
                        onClick={() => onMealClick(meal.name)}
                        className={`
                            flex items-center gap-1.5 px-4 h-[36px] rounded-[20px] border whitespace-nowrap transition-all active:scale-95 text-[12px] font-bold
                            ${hasData 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/10' 
                                : 'bg-[#1e1e1e] border-[#333] text-[#666]'
                            }
                        `}
                    >
                        <span>{meal.name} · {kcal} kcal</span>
                    </button>
                );
            })}
        </div>
    );
};

export default MealChips;
