import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { THEMES } from '../theme';
import { db } from '../firebase.js';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import EnergyHistoryGraph from './EnergyHistoryGraph';

const ReportsView = ({ theme, user }) => {
    const [viewType, setViewType] = useState('combined');
    const [range, setRange] = useState('month'); // Default to month
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null); // For Month view interaction

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let start, end;
                const today = new Date();

                if (range === 'month') {
                    start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                    end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                } else {
                    const days = range === '2w' ? 14 : range === '30d' ? 30 : 60;
                    end = new Date(); // Today
                    start = new Date();
                    start.setDate(today.getDate() - days + 1);
                }

                // Format for Firestore (YYYY-MM-DD)
                const startStr = start.toLocaleDateString('en-CA');
                const endStr = end.toLocaleDateString('en-CA');

                const q = query(
                    collection(db, 'users', user.uid, 'daily_logs'),
                    where('__name__', '>=', startStr),
                    where('__name__', '<=', endStr)
                );

                const snapshot = await getDocs(q);
                const fetchedData = {};
                snapshot.docs.forEach(doc => {
                    fetchedData[doc.id] = doc.data();
                });

                const qAll = query(
                    collection(db, 'activities'),
                    where('userId', '==', user.uid)
                );
                const actSnap = await getDocs(qAll);
                const actMap = {};
                actSnap.docs.forEach(doc => {
                    const actData = doc.data();
                    const docTime = actData.date?.toMillis ? actData.date.toMillis() : 0;
                    if (docTime > 0) {
                        // Keep consistent with local timezone bounds formatting
                        const actDate = new Date(docTime);
                        const actDateStr = new Date(docTime - actDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                        if (!actMap[actDateStr]) actMap[actDateStr] = [];
                        actMap[actDateStr].push({ id: doc.id, ...actData });
                    }
                });

                const data = [];
                // Iterate from start to end to ensure all days are covered
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    // Standardize timezone string like en-CA does
                    const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    const docData = fetchedData[dateStr] || {};
                    const burned = docData.burned || (docData.exercises ? docData.exercises.reduce((acc, ex) => acc + (ex.calories || 0), 0) : 0);
                    const consumed = docData.totals?.cals || 0;

                    const dayActs = actMap[dateStr] || [];

                    data.push({
                        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        fullDate: dateStr,
                        dayNum: d.getDate(),
                        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        consumed: consumed,
                        burned: burned,
                        net: consumed - burned,
                        activities: dayActs
                    });
                }

                setHistoryData(data);
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, range, currentMonth]);

    const styles = THEMES[theme];

    const changeMonth = (delta) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    // Helper for Calendar Grid
    const getCalendarDays = () => {
        if (range !== 'month') return [];
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const startDay = startOfMonth.getDay(); // 0 = Sunday
        const days = [];

        // Empty slots for start of month
        for (let i = 0; i < startDay; i++) {
            days.push({ empty: true, key: `empty-${i}` });
        }

        // Actual days
        historyData.forEach(day => days.push(day));
        return days;
    };

    return (
        <div className="space-y-6 animate-fade-in mt-12 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className={`text-2xl font-bold ${styles.textMain}`}>Energy Reports</h1>
                <div className={`p-2 rounded-full ${styles.card}`}><BarChart2 size={20} className={styles.textMain} /></div>
            </div>

            {/* Range Selector */}
            <div className={`rounded-3xl p-2 flex justify-between items-center border mb-4 ${styles.card} ${styles.border}`}>
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {['month', '2w', '30d', '60d'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap
                                ${range === r
                                    ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white')
                                    : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}
                            `}
                        >
                            {r === 'month' ? 'Month' : r === '2w' ? '14 Days' : r === '30d' ? '30 Days' : '60 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* View Type Toggle for Graphs */}
            {range !== 'month' && (
                <div className="flex justify-center mb-6">
                    <div className={`p-1 rounded-full flex items-center border ${styles.card} ${styles.border}`}>
                        {['combined', 'consumed', 'burned', 'net'].map(type => (
                            <button
                                key={type}
                                onClick={() => setViewType(type)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                                    ${viewType === type
                                        ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm')
                                        : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {range === 'month' && (
                <div className="flex items-center justify-between mb-4 px-2">
                    <button onClick={() => changeMonth(-1)} className={`p-2 rounded-full hover:bg-gray-200/20 ${styles.textSec}`}><ChevronLeft size={20} /></button>
                    <span className={`text-lg font-bold ${styles.textMain}`}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className={`p-2 rounded-full hover:bg-gray-200/20 ${styles.textSec}`}><ChevronRight size={20} /></button>
                </div>
            )}

            {loading ? (
                <div className="h-[300px] flex flex-col items-center justify-center opacity-50">
                    <Loader2 className="animate-spin mb-2" />
                    <span className="text-xs">Crunching numbers...</span>
                </div>
            ) : historyData.length > 0 ? (
                range === 'month' ? (
                    <div className={`p-4 rounded-[2rem] border ${styles.card} ${styles.border}`}>
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-2 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className={`text-[10px] font-bold opacity-50 ${styles.textSec}`}>{d}</div>
                            ))}
                        </div>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {getCalendarDays().map((day, i) => (
                                day.empty ? (
                                    <div key={day.key} className="aspect-square"></div>
                                ) : (
                                    <div
                                        key={day.fullDate}
                                        onClick={() => setSelectedDay(day)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all cursor-pointer hover:scale-105 active:scale-95
                                            ${selectedDay?.fullDate === day.fullDate
                                                ? (theme === 'dark' ? 'bg-blue-600 border-blue-500 ring-2 ring-blue-500/50' : 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-500/30')
                                                : (theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-gray-100')}
                                        `}
                                    >
                                        <span className={`text-xs font-bold mb-0.5 ${selectedDay?.fullDate === day.fullDate ? 'text-white' : styles.textMain}`}>{day.dayNum}</span>
                                        {day.activities && day.activities.length > 0 && (
                                            <span className="text-[10px] leading-none block mb-0.5">🏃</span>
                                        )}
                                        {(day.consumed > 0 || day.burned > 0) && (
                                            <div className="flex flex-col gap-0.5 w-full px-1">
                                                {day.consumed > 0 && <div className={`h-1 w-full rounded-full opacity-80 ${selectedDay?.fullDate === day.fullDate ? 'bg-white/50' : 'bg-blue-500'}`}></div>}
                                                {day.burned > 0 && <div className={`h-1 w-full rounded-full opacity-80 ${selectedDay?.fullDate === day.fullDate ? 'bg-white/30' : 'bg-red-500'}`}></div>}
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>

                        {/* Summary Card for Selected Day */}
                        {selectedDay && (
                            <div className={`mt-6 p-4 rounded-2xl border animate-fade-in ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : 'bg-slate-50 border-slate-100')}`}>
                                <p className={`text-center text-xs font-bold uppercase tracking-widest mb-3 ${styles.textSec}`}>{selectedDay.date}</p>
                                <div className="flex justify-around items-center">
                                    <div className="text-center">
                                        <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Intake</p>
                                        <p className={`text-xl font-black ${styles.textMain}`}>{selectedDay.consumed}</p>
                                    </div>
                                    <div className={`h-8 w-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Burned</p>
                                        <p className={`text-xl font-black ${styles.textMain}`}>{selectedDay.burned}</p>
                                    </div>
                                    <div className={`h-8 w-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Net</p>
                                        <p className={`text-xl font-black ${styles.textMain}`}>{selectedDay.net}</p>
                                    </div>
                                </div>
                                
                                {selectedDay.activities && selectedDay.activities.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200/20">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                                            🏃 Activities
                                        </div>
                                        {selectedDay.activities.map(a => (
                                            <div key={a.id} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${theme === 'dark' ? 'border-[#3a3a3a]' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span>{a.activityType === 'running' ? '🏃' : a.activityType === 'walking' ? '🚶' : a.activityType === 'cycling' ? '🚴' : a.activityType === 'skipping' ? '🦘' : '⚡'}</span>
                                                    <span className={`text-sm tracking-wide capitalize ${styles.textMain}`}>{a.activityType}</span>
                                                </div>
                                                <span className="text-sm text-[#ff5733] font-semibold">
                                                    -{a.caloriesBurned} kcal
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <EnergyHistoryGraph data={historyData} theme={theme} viewMode={viewType} />
                )
            ) : (
                <div className={`h-[300px] flex flex-col items-center justify-center rounded-3xl border ${styles.card} ${styles.border} opacity-60`}>
                    <p>No data for this period.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
