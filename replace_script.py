import os
import re

with open('src/pages/DashboardPage.jsx', 'r', encoding='utf-8') as f:
    data = f.read()

replacement = '''            <div className="mb-6 space-y-3">
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
                    const mealCals = logs[meal].reduce((acc, i) => acc + i.calories, 0);
                    const mealStats = logs[meal].reduce((acc, item) => ({
                        pro: acc.pro + (item.protein || 0),
                        carb: acc.carb + (item.carbs || 0),
                        fat: acc.fat + (item.fat || 0),
                    }), { pro: 0, carb: 0, fat: 0 });
                    const totalGrams = mealStats.pro + mealStats.carb + mealStats.fat || 1;
                    const pPct = (mealStats.pro / totalGrams) * 100;
                    const cPct = (mealStats.carb / totalGrams) * 100;
                    const fPct = (mealStats.fat / totalGrams) * 100;
                    
                    const isExpanded = expandedMeals[meal];
                    const mealIcons = { Breakfast: '🌅', Lunch: '🌞', Dinner: '🌙', Snacks: '🍎' };

                    return (
                        <div key={meal} className={`rounded-[1.25rem] border transition-all overflow-hidden ${theme === 'dark' ? 'bg-[#1A1A1A] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div 
                                className="p-4 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform"
                                onClick={() => setExpandedMeals(prev => ({ ...prev, [meal]: !prev[meal] }))}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-xl">{mealIcons[meal]}</div>
                                    <div>
                                        <h3 className={`text-base font-bold ${styles.textMain}`}>{meal}</h3>
                                        <p className="text-[12px] font-medium text-[#888888]">{Math.round(mealCals)} kcal</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isExpanded ? <ChevronUp size={16} className="text-[#888888]" /> : <ChevronDown size={16} className="text-[#888888]" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 animate-fade-in border-t border-[rgba(255,255,255,0.03)] pt-4" onClick={(e) => e.stopPropagation()}>
                                    {mealCals > 0 && (
                                        <div className={`mb-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                        <span className={`text-[10px] font-bold ${styles.textSec}`}>Protein</span>
                                                    </div>
                                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(pPct, 100)}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.pro)}g</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        <span className={`text-[10px] font-bold ${styles.textSec}`}>Carbs</span>
                                                    </div>
                                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(cPct, 100)}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.carb)}g</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 w-16 shrink-0">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                        <span className={`text-[10px] font-bold ${styles.textSec}`}>Fat</span>
                                                    </div>
                                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-200'}`}>
                                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(fPct, 100)}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold w-8 text-right ${styles.textSec}`}>{Math.round(mealStats.fat)}g</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {mealCals > 0 && <div className={`h-px mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`} />}

                                    <div className="space-y-2">
                                        {logs[meal].length > 0 ? (
                                            logs[meal].map((food) => (
                                                <FoodItem key={food.uid} food={food} theme={theme} onClick={onFoodClick} />
                                            ))
                                        ) : (
                                            <div className={`flex flex-col items-center justify-center h-28 gap-2 border-2 border-dashed rounded-2xl cursor-pointer hover:opacity-80 active:scale-95 transition ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200/50 bg-gray-50'}`} onClick={() => onAddClick(meal, 'food')}>
                                                <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                                                    <Plus size={18} className={`opacity-60 ${styles.textMain}`} />
                                                </div>
                                                <span className={`text-xs font-bold opacity-80 ${styles.textMain}`}>Tap to log {meal}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>'''

new_data = re.sub(r'<div className="mb-6">.*?\}\)\(\)\}\n\s*</div>', replacement, data, flags=re.DOTALL)

with open('src/pages/DashboardPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_data)
print('Done!')
