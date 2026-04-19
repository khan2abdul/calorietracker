import React, { useState } from 'react';
import { Droplets, Minus, Plus, X } from 'lucide-react';

const WaterInputModal = ({ isOpen, onClose, currentGlasses, onAdd, theme }) => {
    const [glasses, setGlasses] = useState(currentGlasses || 0);

    if (!isOpen) return null;

    const handleAdd = () => {
        onAdd(glasses - currentGlasses);
        onClose();
    };

    const increment = () => setGlasses(prev => prev + 1);
    const decrement = () => setGlasses(prev => Math.max(0, prev - 1));

    const ml = glasses * 250;
    const liters = (ml / 1000).toFixed(1);

    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-6">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up ${theme === 'dark' ? 'bg-[#1C1C1E] border border-white/10' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-500/20">
                            <Droplets className="text-blue-400" size={22} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add Water</h3>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>1 glass = 250ml</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} transition-colors`}>
                        <X size={18} />
                    </button>
                </div>

                {/* Counter */}
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-6 mb-4">
                        <button 
                            onClick={decrement}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Minus size={24} />
                        </button>
                        <div className="text-center">
                            <p className={`text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{glasses}</p>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>glasses</p>
                        </div>
                        <button 
                            onClick={increment}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-500 text-white transition-all active:scale-90 hover:bg-blue-400"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {liters}L ({ml}ml)
                    </p>
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {[1, 2, 3, 4].map(n => (
                        <button
                            key={n}
                            onClick={() => setGlasses(n)}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${glasses === n 
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                : theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {n} glass{n > 1 ? 'es' : ''}
                        </button>
                    ))}
                </div>

                {/* Confirm Button */}
                <button 
                    onClick={handleAdd}
                    disabled={glasses === currentGlasses}
                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 ${glasses === currentGlasses 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400'}`}
                >
                    {glasses > currentGlasses ? `Add ${glasses - currentGlasses} glass${glasses - currentGlasses > 1 ? 'es' : ''}` : glasses < currentGlasses ? `Remove ${currentGlasses - glasses} glass${currentGlasses - glasses > 1 ? 'es' : ''}` : 'No change'}
                </button>
            </div>
        </div>
    );
};

export default WaterInputModal;
