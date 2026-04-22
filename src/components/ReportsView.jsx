import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Loader2, Scale, Plus, Target, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { THEMES } from '../theme';
import { db } from '../firebase.js';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { getLocalDateStr } from '../utils';
import EnergyHistoryGraph from './EnergyHistoryGraph';
import WeightHistoryGraph from './WeightHistoryGraph';

const ReportsView = ({ theme, user, minimal = false, onLogWeight }) => {
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

                const startStr = getLocalDateStr(start);

                const logsQ = query(collection(db, 'users', user.uid, 'daily_logs'), where('__name__', '>=', startStr));
                const sessionsQ = query(collection(db, 'activities'), where('userId', '==', user.uid));
                const userQ = query(collection(db, 'users'), where('__name__', '==', user.uid));

                const [snapshot, sessionsSnap, userSnap] = await Promise.all([
                    getDocs(logsQ),
                    getDocs(sessionsQ),
                    getDocs(userQ)
                ]);

                const fetchedData = {};
                snapshot.docs.forEach(doc => { fetchedData[doc.id] = doc.data(); });

                const fetchedSessions = {};
                const startMs = start.getTime();
                sessionsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.date && typeof data.date.toDate === 'function') {
                        const actDate = data.date.toDate();
                        if (actDate.getTime() >= startMs) {
                            const actDateStr = getLocalDateStr(actDate);
                            if (!fetchedSessions[actDateStr]) fetchedSessions[actDateStr] = 0;
                            fetchedSessions[actDateStr] += Number(data.caloriesBurned || 0);
                        }
                    }
                });

                let currentUserStats = null;
                if (!userSnap.empty) {
                    currentUserStats = userSnap.docs[0].data();
                    setUserStats(currentUserStats);
                }

                const energyData = [];
                const weightData = [];

                // Only include initial weight if startDate falls within the selected range
                if (currentUserStats?.initialWeight && currentUserStats?.startDate) {
                    const startD = new Date(currentUserStats.startDate);
                    if (startD >= start && startD <= today) {
                        weightData.push({
                            date: startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            weight: currentUserStats.initialWeight,
                            fullDate: currentUserStats.startDate,
                            isInitial: true
                        });
                    }
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
                        consumed,
                        burned,
                        net: consumed - burned
                    });

                    if (weightVal) {
                        weightData.push({
                            date: dateLabel,
                            weight: weightVal,
                            fullDate: dateStr
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
        if (!newWeight || isNaN(newWeight) || !onLogWeight) return;
        setIsLoggingWeight(true);
        try {
            await onLogWeight(Number(newWeight));
            setNewWeight('');
            setRefreshKey(prev => prev + 1);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingWeight(false);
        }
    };

    // ---- Weight Stats ----
    const weightStats = useMemo(() => {
        if (!userStats) return null;
        const dailyLogs = weightLogs.filter(w => !w.isInitial);
        if (dailyLogs.length === 0) return null;

        const latest = dailyLogs[dailyLogs.length - 1].weight;
        const initial = userStats.initialWeight || latest;
        const target = userStats.targetWeight;
        const heightM = (userStats.height || 0) / 100;

        const totalChange = latest - initial;
        const startD = userStats.startDate ? new Date(userStats.startDate) : new Date();
        const weeksActive = Math.max(1, (Date.now() - startD.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weeklyRate = totalChange / weeksActive;

        const bmi = heightM > 0 ? (latest / (heightM * heightM)).toFixed(1) : null;
        const remaining = target != null ? target - latest : null;
        const progressPct = (target != null && initial !== target)
            ? Math.min(100, Math.max(0, (totalChange / (target - initial)) * 100))
            : null;

        return { latest, initial, target, totalChange, weeklyRate, bmi, remaining, progressPct, weeksActive };
    }, [weightLogs, userStats]);

    const hasInRangeLogs = weightLogs.some(w => !w.isInitial);
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
                <button onClick={() => setViewType('energy')} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewType === 'energy' ? (theme === 'dark' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg') : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}>
                    <BarChart2 size={14} /> Energy
                </button>
                <button onClick={() => setViewType('weight')} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${viewType === 'weight' ? (theme === 'dark' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg') : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}>
                    <Scale size={14} /> Weight
                </button>
            </div>

            {/* Range Selector & Energy Sub-View */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 justify-center">
                    {['2w', '30d', '60d'].map(r => (
                        <button key={r} onClick={() => setRange(r)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${range === r ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' : 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105') : (theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600')}`}>
                            {r === '2w' ? '14 Days' : r === '30d' ? '30 Days' : '60 Days'}
                        </button>
                    ))}
                </div>

                {viewType === 'energy' && (
                    <div className="flex justify-center">
                        <div className={`p-1 rounded-full flex border ${styles.card} ${styles.border}`}>
                            {['combined', 'consumed', 'burned', 'net'].map(type => (
                                <button key={type} onClick={() => setEnergySubView(type)} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${energySubView === type ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
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
                    {/* Weight Stats Bento */}
                    {weightStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <StatCard 
                                label="Total Change" 
                                value={`${weightStats.totalChange > 0 ? '+' : ''}${weightStats.totalChange.toFixed(1)} kg`}
                                icon={weightStats.totalChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                color={weightStats.totalChange <= 0 ? 'text-green-500' : 'text-orange-500'}
                                bg={theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}
                                theme={theme}
                            />
                            <StatCard 
                                label="Weekly Avg" 
                                value={`${weightStats.weeklyRate > 0 ? '+' : ''}${weightStats.weeklyRate.toFixed(2)} kg`}
                                icon={<Activity size={14} />}
                                color={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}
                                bg={theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}
                                theme={theme}
                            />
                            <StatCard 
                                label="BMI" 
                                value={weightStats.bmi || '--'}
                                icon={<Scale size={14} />}
                                color={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}
                                bg={theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'}
                                theme={theme}
                            />
                            {weightStats.progressPct != null && (
                                <StatCard 
                                    label="To Goal" 
                                    value={`${Math.round(weightStats.progressPct)}%`}
                                    icon={<Target size={14} />}
                                    color="text-green-500"
                                    bg={theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}
                                    theme={theme}
                                />
                            )}
                            <StatCard 
                                label="Latest" 
                                value={`${weightStats.latest} kg`}
                                icon={<Scale size={14} />}
                                color={theme === 'dark' ? 'text-white' : 'text-gray-800'}
                                bg={theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}
                                theme={theme}
                            />
                            {weightStats.remaining != null && (
                                <StatCard 
                                    label="Remaining" 
                                    value={`${Math.abs(weightStats.remaining).toFixed(1)} kg`}
                                    icon={<Target size={14} />}
                                    color={theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}
                                    bg={theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-100'}
                                    theme={theme}
                                />
                            )}
                        </div>
                    )}

                    {/* Weight Graph */}
                    {hasInRangeLogs ? (
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
                            <p className="text-sm font-bold opacity-50">No weight entries for this period</p>
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
                                className={`px-8 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all active:scale-95 shadow-lg ${isLoggingWeight || !newWeight ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-400'}`}
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

const StatCard = ({ label, value, icon, color, bg, theme }) => (
    <div className={`p-4 rounded-2xl border flex flex-col items-center gap-2 ${bg} ${theme === 'dark' ? 'border-opacity-20' : ''}`}>
        <div className={`flex items-center gap-1.5 ${color}`}>
            {icon}
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
        </div>
        <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{value}</span>
    </div>
);

export default ReportsView;