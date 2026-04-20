import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, Scale, Plus, Target } from 'lucide-react';
import { THEMES } from '../theme';
import { db } from '../firebase.js';
import { collection, query, getDocs, where, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getLocalDateStr } from '../utils';
import EnergyHistoryGraph from './EnergyHistoryGraph';
import WeightHistoryGraph from './WeightHistoryGraph';

const ReportsView = ({ theme, user, minimal = false }) => {
    const [viewType, setViewType] = useState('energy'); // 'energy' or 'weight'
    const [energySubView, setEnergySubView] = useState('combined');
    const [range, setRange] = useState('30d'); 
    const [historyData, setHistoryData] = useState([]);
    const [weightLogs, setWeightLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWeight, setNewWeight] = useState('');
    const [isLoggingWeight, setIsLoggingWeight] = useState(false);
    const [userStats, setUserStats] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const today = new Date();
                const days = range === '2w' ? 14 : range === '30d' ? 30 : 60;
                const start = new Date();
                start.setDate(today.getDate() - days + 1);
                start.setHours(0,0,0,0);

                // Format for Firestore (YYYY-MM-DD) local
                const startStr = getLocalDateStr(start);

                // Run queries in parallel for performance
                const logsQ = query(collection(db, 'users', user.uid, 'daily_logs'), where('__name__', '>=', startStr));
                
                // Fetch from the root 'activities' collection. 
                // We omit the date inequality (>=) query to avoid triggering a Firebase composite index requirement error
                const sessionsQ = query(
                    collection(db, 'activities'), 
                    where('userId', '==', user.uid)
                );
                
                const userQ = query(collection(db, 'users'), where('__name__', '==', user.uid));

                const [snapshot, sessionsSnap, userSnap] = await Promise.all([
                    getDocs(logsQ),
                    getDocs(sessionsQ),
                    getDocs(userQ)
                ]);

                // 1. Process Daily Logs
                const fetchedData = {};
                snapshot.docs.forEach(doc => {
                    fetchedData[doc.id] = doc.data();
                });

                // 2. Process Activities (Workout Sessions)
                const fetchedSessions = {};
                const startMs = start.getTime(); // Used for manual date boundary filtering
                
                sessionsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.date && typeof data.date.toDate === 'function') {
                        const actDate = data.date.toDate();
                        // Only process activities that fall within our date range
                        if (actDate.getTime() >= startMs) {
                            const actDateStr = getLocalDateStr(actDate);
                            if (!fetchedSessions[actDateStr]) fetchedSessions[actDateStr] = 0;
                            fetchedSessions[actDateStr] += Number(data.caloriesBurned || 0);
                        }
                    }
                });

                // 3. Process User Stats
                let currentUserStats = null;
                if (!userSnap.empty) {
                    currentUserStats = userSnap.docs[0].data();
                    setUserStats(currentUserStats);
                }

                // 4. Assemble Data Arrays
                const energyData = [];
                const weightData = [];

                // Always include initial weight as the starting point if it exists
                if (currentUserStats?.initialWeight && currentUserStats?.startDate) {
                    const startD = new Date(currentUserStats.startDate);
                    weightData.push({
                        date: startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        weight: currentUserStats.initialWeight,
                        fullDate: currentUserStats.startDate, // Use full ISO for sub-day precision in X-axis
                        isInitial: true
                    });
                }

                for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
                    const dateStr = getLocalDateStr(d);
                    const docData = fetchedData[dateStr] || {};
                    const sessionBurn = fetchedSessions[dateStr] || 0;
                    
                    const legacyBurn = docData.burned || (docData.exercises ? docData.exercises.reduce((acc, ex) => acc + (ex.calories || 0), 0) : 0);
                    const burned = legacyBurn + sessionBurn;
                    const consumed = docData.totals?.cals || 0;
                    const weightVal = docData.weight || null;

                    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    energyData.push({
                        date: dateLabel,
                        fullDate: dateStr,
                        consumed: consumed,
                        burned: burned,
                        net: consumed - burned
                    });

                    // Add the weight log for the day. If it's the same day as initial, 
                    // it will show as a second point because its fullDate (YYYY-MM-DD) 
                    // is different from the initial's full ISO string.
                    if (weightVal) {
                        weightData.push({
                            date: dateLabel,
                            weight: weightVal,
                            fullDate: dateStr + 'T23:59:59' // Put it at end of day for spacing
                        });
                    }
                }

                setHistoryData(energyData);
                setWeightLogs(weightData.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate)));
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, range, viewType, refreshKey]);

    const handleLogWeight = async () => {
        if (!newWeight || isNaN(newWeight)) return;
        setIsLoggingWeight(true);
        try {
            const todayStr = getLocalDateStr(new Date());
            const weightVal = Number(newWeight);

            // Log in daily history
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', todayStr), { 
                weight: weightVal,
                updatedAt: serverTimestamp() 
            }, { merge: true });

            // Update main user record
            await setDoc(doc(db, 'users', user.uid), {
                weight: weightVal
            }, { merge: true });

            setNewWeight('');
            setRefreshKey(prev => prev + 1); // Trigger fetch
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingWeight(false);
        }
    };

    const styles = THEMES[theme];

    return (
        <div className="space-y-6 animate-fade-in mt-6 mb-8">
            {!minimal && (
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${styles.card} border ${styles.border}`}>
                            <BarChart2 size={22} className={styles.textMain} />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-black tracking-tight ${styles.textMain}`}>Insights</h1>
                            <p className={`text-[10px] font-bold uppercase tracking-widest opacity-50 ${styles.textSec}`}>Your Progress Reports</p>
                        </div>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className={`p-1.5 rounded-3xl flex border mb-6 ${styles.card} ${styles.border}`}>
                <button
                    onClick={() => setViewType('energy')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${viewType === 'energy'
                            ? (theme === 'dark' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg')
                            : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
                    `}
                >
                    <BarChart2 size={14} /> Energy
                </button>
                <button
                    onClick={() => setViewType('weight')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${viewType === 'weight'
                            ? (theme === 'dark' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg')
                            : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
                    `}
                >
                    <Scale size={14} /> Weight
                </button>
            </div>

            {/* Range Selector & Energy Sub-View (only for energy) */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 justify-center">
                    {['2w', '30d', '60d'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border
                                ${range === r
                                    ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' : 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105')
                                    : (theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600')}
                            `}
                        >
                            {r === '2w' ? '14 Days' : r === '30d' ? '30 Days' : '60 Days'}
                        </button>
                    ))}
                </div>

                {viewType === 'energy' && (
                    <div className="flex justify-center">
                        <div className={`p-1 rounded-full flex border ${styles.card} ${styles.border}`}>
                            {['combined', 'consumed', 'burned', 'net'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setEnergySubView(type)}
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all
                                        ${energySubView === type
                                            ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white')
                                            : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="h-[300px] flex flex-col items-center justify-center opacity-50">
                    <Loader2 className="animate-spin mb-3 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Crunching numbers...</span>
                </div>
            ) : viewType === 'energy' ? (
                historyData.length > 0 ? (
                    <EnergyHistoryGraph data={historyData} theme={theme} viewMode={energySubView} />
                ) : (
                    <div className={`h-[300px] flex items-center justify-center rounded-3xl border border-dashed ${styles.card} ${styles.border} opacity-50`}>
                        <p className="text-xs font-bold uppercase tracking-widest">No data for this period</p>
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    {/* Weight History Table/Graph */}
                    {weightLogs.length > 0 ? (
                        <WeightHistoryGraph 
                            data={weightLogs} 
                            theme={theme} 
                            userStats={userStats}
                            rangeStart={getLocalDateStr(new Date(Date.now() - (range === '2w' ? 14 : range === '30d' ? 30 : 60) * 24 * 60 * 60 * 1000))}
                            rangeEnd={getLocalDateStr(new Date())}
                        />
                    ) : (
                        <div className={`p-8 rounded-[2.5rem] border border-dashed text-center ${styles.card} ${styles.border} opacity-60`}>
                            <Scale size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-bold opacity-50">No weight entries yet</p>
                            <p className="text-[10px] uppercase tracking-tighter mt-1">Log your first weigh-in below</p>
                        </div>
                    )}

                    {/* Quick Log Weight Card */}
                    <div className={`p-6 rounded-[2.5rem] border shadow-xl ${theme === 'dark' ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
                                <Plus size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-black ${styles.textMain}`}>Log Weight</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest text-blue-500`}>Weekly Progress Check</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className={`flex-1 flex items-center px-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-black/20 border-white/5 focus-within:border-blue-500/50' : 'bg-white border-blue-100 focus-within:border-blue-400'}`}>
                                <input 
                                    type="number" 
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder={userStats?.weight || "0.0"} 
                                    className={`w-full py-4 bg-transparent text-xl font-black outline-none ${styles.textMain}`}
                                />
                                <span className={`text-sm font-bold ml-2 opacity-50 ${styles.textMain}`}>kg</span>
                            </div>
                            <button 
                                onClick={handleLogWeight}
                                disabled={isLoggingWeight || !newWeight}
                                className={`px-8 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all active:scale-95 shadow-lg
                                    ${isLoggingWeight || !newWeight 
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                        : 'bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-400'}
                                `}
                            >
                                {isLoggingWeight ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                            </button>
                        </div>

                        {userStats?.targetWeight && (
                            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-black/10">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-green-500" />
                                    <span className="text-[10px] font-black uppercase text-gray-400">Target</span>
                                </div>
                                <span className={`text-sm font-black ${styles.textMain}`}>{userStats.targetWeight} kg</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
