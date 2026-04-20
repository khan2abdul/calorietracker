import React, { useState } from 'react';
import { ArrowRight, Ruler, Weight, Target, Calendar, Clock } from 'lucide-react';
import { THEMES } from '../theme';
import { TARGET_DAY_OPTIONS } from '../config';

const OnboardingModal = ({ userStats, onComplete, theme }) => {
    const [stats, setStats] = useState(userStats || { age: '', weight: '', height: '', targetWeight: '', targetDays: 90 });
    const styles = THEMES[theme];

    const handleChange = (field, value) => {
        setStats(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onComplete(stats);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            <div className={`relative w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl transform transition-all scale-100 border ${styles.card} ${styles.border}`}>
                <div className="text-center mb-8">
                    <h2 className={`text-3xl font-extrabold mb-2 ${styles.textMain}`}>Welcome! 👋</h2>
                    <p className={styles.textSec}>Let's personalize your fitness journey.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Calendar size={24} />
                        </div>
                        <div className="flex-1">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>Age</label>
                            <input
                                type="number"
                                required
                                placeholder="25"
                                className={`w-full bg-transparent text-lg font-bold outline-none ${styles.textMain}`}
                                value={stats.age}
                                onChange={(e) => handleChange('age', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                            <Weight size={24} />
                        </div>
                        <div className="flex-1">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>Current Weight (kg)</label>
                            <input
                                type="number"
                                required
                                placeholder="70"
                                className={`w-full bg-transparent text-lg font-bold outline-none ${styles.textMain}`}
                                value={stats.weight}
                                onChange={(e) => handleChange('weight', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                            <Ruler size={24} />
                        </div>
                        <div className="flex-1">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>Height (cm)</label>
                            <input
                                type="number"
                                required
                                placeholder="175"
                                className={`w-full bg-transparent text-lg font-bold outline-none ${styles.textMain}`}
                                value={stats.height}
                                onChange={(e) => handleChange('height', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                            <Target size={24} />
                        </div>
                        <div className="flex-1">
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>Target Weight (kg)</label>
                            <input
                                type="number"
                                required
                                placeholder="65"
                                className={`w-full bg-transparent text-lg font-bold outline-none ${styles.textMain}`}
                                value={stats.targetWeight}
                                onChange={(e) => handleChange('targetWeight', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Target Timeline */}
                    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
                                <Clock size={20} />
                            </div>
                            <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>Goal Timeline (days)</label>
                        </div>
                        <div className="flex gap-2">
                            {TARGET_DAY_OPTIONS.map(days => {
                                const isActive = (stats.targetDays || 90) === days;
                                return (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => handleChange('targetDays', days)}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            isActive
                                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
                                                : (theme === 'dark'
                                                    ? 'bg-[#1C1C1E] text-gray-400 hover:bg-[#3C3C3E]'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300')
                                        }`}
                                    >
                                        {days}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 mt-4 shadow-lg transform transition-all active:scale-95 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-black hover:bg-gray-800'}`}
                    >
                        Get Started <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;

