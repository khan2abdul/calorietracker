import React, { useState } from 'react';
import { X, Calendar as CalIcon, Flame, Save } from 'lucide-react';
import { THEMES } from '../../theme';

const EditDayModal = ({ dayData, onClose, onSave, theme }) => {
    const [cals, setCals] = useState(dayData?.totals?.cals || 0);
    const [pro, setPro] = useState(dayData?.totals?.pro || 0);
    const [carb, setCarb] = useState(dayData?.totals?.carb || 0);
    const [fat, setFat] = useState(dayData?.totals?.fat || 0);
    const [burned, setBurned] = useState(dayData?.burned || 0);
    const styles = THEMES[theme] || THEMES.dark;

    const Input = ({ label, value, onChange, color }) => (
        <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textSec}`}>{label}</span>
            <input
                type="number"
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className={`w-full p-4 rounded-2xl border font-bold text-lg outline-none transition-all focus:ring-2 focus:ring-current ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : 'bg-gray-50 border-gray-100'}`}
                style={{ color: color }}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center animate-slide-up">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-sm rounded-t-[3rem] p-8 shadow-2xl border-t ${styles.card} ${styles.border}`}>
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <CalIcon size={20} className={styles.textSec} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${styles.textMain}`}>Override Data</h3>
                            <p className="text-xs text-gray-500">{dayData.date}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}><X size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="col-span-2">
                        <Input label="Total Calories" value={cals} onChange={setCals} color="#FFFFFF" />
                    </div>
                    <Input label="Protein (g)" value={pro} onChange={setPro} color="#0A84FF" />
                    <Input label="Carbs (g)" value={carb} onChange={setCarb} color="#30D158" />
                    <Input label="Fats (g)" value={fat} onChange={setFat} color="#FF9F0A" />
                    <div className="col-span-2 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame size={14} className="text-red-500" />
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-red-500`}>Exercise Burned</span>
                        </div>
                        <input
                            type="number"
                            value={burned}
                            onChange={e => setBurned(Number(e.target.value))}
                            className={`w-full p-4 rounded-2xl border font-bold text-lg outline-none transition-all focus:ring-2 focus:ring-red-500 ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        onSave(dayData.date, { totals: { cals, pro, carb, fat }, burned });
                        onClose();
                    }}
                    className={`w-full py-4 rounded-[1.5rem] font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                >
                    <Save size={18} /> Update Diary
                </button>
            </div>
        </div>
    );
};

export default EditDayModal;
