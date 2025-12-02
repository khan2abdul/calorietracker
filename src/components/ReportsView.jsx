import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { THEMES } from '../theme';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import EnergyHistoryGraph from './EnergyHistoryGraph';

const ReportsView = ({ theme, user }) => {
    const [viewType, setViewType] = useState('combined');
    const [range, setRange] = useState('2w');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const days = range === '2w' ? 14 : range === '4w' ? 28 : 56;
                const q = query(
                    collection(db, 'users', user.uid, 'daily_logs'),
                    orderBy('__name__', 'desc'),
                    limit(days)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => {
                    const d = doc.data();
                    const burned = d.burned || (d.exercises ? d.exercises.reduce((acc, ex) => acc + (ex.calories || 0), 0) : 0);
                    const consumed = d.totals?.cals || 0;
                    return {
                        date: new Date(doc.id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        fullDate: doc.id,
                        consumed: consumed,
                        burned: burned,
                        net: consumed - burned
                    };
                });

                // Reverse to show oldest to newest
                setHistoryData(data.reverse());
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, range]);

    const styles = THEMES[theme];

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-4 pt-14">
            <div className="flex justify-between items-center mb-4">
                <h1 className={`text-2xl font-bold ${styles.textMain}`}>Energy Reports</h1>
                <div className={`p-2 rounded-full ${styles.card}`}><BarChart2 size={20} className={styles.textMain} /></div>
            </div>

            {loading ? (
                <div className="h-[300px] flex flex-col items-center justify-center opacity-50">
                    <Loader2 className="animate-spin mb-2" />
                    <span className="text-xs">Crunching numbers...</span>
                </div>
            ) : historyData.length > 0 ? (
                <EnergyHistoryGraph data={historyData} theme={theme} viewMode={viewType} />
            ) : (
                <div className={`h-[300px] flex flex-col items-center justify-center rounded-3xl border ${styles.card} ${styles.border} opacity-60`}>
                    <p>No data for this period.</p>
                </div>
            )}

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
