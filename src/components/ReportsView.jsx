import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { THEMES } from '../theme';
import { generateHistoryData } from '../utils';
import EnergyHistoryGraph from './EnergyHistoryGraph';

const ReportsView = ({ theme }) => {
    const [viewType, setViewType] = useState('combined');
    const [range, setRange] = useState('2w');
    const historyData = useMemo(() => {
        const days = range === '2w' ? 14 : range === '4w' ? 28 : 56;
        return generateHistoryData(days);
    }, [range]);

    const styles = THEMES[theme];

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-4 pt-14">
            <div className="flex justify-between items-center mb-4">
                <h1 className={`text-2xl font-bold ${styles.textMain}`}>Energy Reports</h1>
                <div className={`p-2 rounded-full ${styles.card}`}><BarChart2 size={20} className={styles.textMain} /></div>
            </div>

            <EnergyHistoryGraph data={historyData} theme={theme} viewMode={viewType} />

            <div className={`rounded-3xl p-5 ${styles.card} border ${styles.border}`}>
                {/* SHOW FILTER */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700/20">
                    <span className={`font-semibold ${styles.textMain}`}>Show</span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {['combined', 'consumed', 'burned', 'net'].map(t => (
                            <button
                                key={t}
                                onClick={() => setViewType(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors 
                        ${viewType === t
                                        ? (theme === 'dark' ? 'bg-white text-black' : (theme === 'wooden' ? 'bg-[#3E2723] text-[#EAD8B1]' : 'bg-black text-white'))
                                        : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-100 text-gray-500')}
                      `}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                {/* DATE RANGE FILTER */}
                <div className="flex justify-between items-center">
                    <span className={`font-semibold ${styles.textMain}`}>Date Range</span>
                    <div className="flex gap-2">
                        {['2w', '4w', '8w'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors 
                        ${range === r
                                        ? (theme === 'dark' ? 'bg-blue-600 text-white' : (theme === 'wooden' ? 'bg-[#8B4513] text-white' : 'bg-blue-500 text-white'))
                                        : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-100 text-gray-500')}
                      `}
                            >
                                {r === '2w' ? '2 Weeks' : r === '4w' ? '4 Weeks' : '8 Weeks'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
