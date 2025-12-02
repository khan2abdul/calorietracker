import React, { useState, useEffect, useMemo } from 'react';
import { THEMES } from '../theme';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Calendar, Flame, Trophy, ChevronRight, TrendingUp, Award } from 'lucide-react';

const DiaryView = ({ theme, user }) => {
    const styles = THEMES[theme];
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'users', user.uid, 'daily_logs'),
            orderBy('__name__', 'desc'),
            limit(14)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                date: doc.id,
                ...doc.data()
            }));
            setHistory(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const stats = useMemo(() => {
        if (!history.length) return { streak: 0, totalDays: 0, bestDay: null };

        // Calculate Streak (consecutive days)
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if today or yesterday exists in history to start streak
        const hasToday = history.find(h => h.date === today);
        const hasYesterday = history.find(h => h.date === yesterday);

        if (hasToday || hasYesterday) {
            streak = 1;
            let currentDate = new Date(hasToday ? today : yesterday);

            // Iterate backwards
            for (let i = 1; i < history.length; i++) {
                currentDate.setDate(currentDate.getDate() - 1);
                const dateStr = currentDate.toISOString().split('T')[0];
                if (history.find(h => h.date === dateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        return { streak, totalDays: history.length };
    }, [history]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getStatusColor = (cals, goal = 2000) => {
        const ratio = cals / goal;
        if (ratio > 1.1) return 'text-red-500';
        if (ratio > 0.9) return 'text-green-500';
        return 'text-orange-500';
    };

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14 max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Diary</h1>
                    <p className={`text-sm font-medium ${styles.textSec} opacity-80`}>Your journey so far</p>
                </div>
                <div className={`p-2 rounded-full border ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <Calendar size={20} className={styles.textSec} />
                </div>
            </div>

            {/* Streak Card */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-8 border transition-all ${theme === 'dark' ? 'bg-gradient-to-br from-orange-900/40 to-[#1C1C1E] border-orange-500/20' : 'bg-gradient-to-br from-orange-50 to-white border-orange-100'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Flame size={20} className="text-orange-500 fill-orange-500 animate-pulse" />
                            <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>Current Streak</span>
                        </div>
                        <h2 className={`text-5xl font-black ${styles.textMain}`}>{stats.streak} <span className="text-lg font-bold opacity-50">days</span></h2>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${theme === 'dark' ? 'border-orange-500/20 bg-orange-500/10' : 'border-orange-100 bg-orange-50'}`}>
                        <Trophy size={32} className="text-orange-500" />
                    </div>
                </div>

                <div className="mt-6 flex gap-2">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < stats.streak % 8 ? 'bg-orange-500' : (theme === 'dark' ? 'bg-white/10' : 'bg-gray-200')}`} />
                    ))}
                </div>
                <p className={`text-xs mt-3 font-medium ${styles.textSec}`}>
                    {stats.streak > 3 ? "You're on fire! Keep it up! 🔥" : "Consistency is key. You got this!"}
                </p>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className={`text-lg font-bold px-1 ${styles.textMain}`}>Recent Logs</h3>

                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading history...</div>
                ) : history.length > 0 ? (
                    <div className="space-y-3">
                        {history.map((day) => (
                            <div key={day.date} className={`p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-[#2C2C2E]/50 border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <span className={`text-[10px] uppercase font-bold ${styles.textSec}`}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className={`text-lg font-bold ${styles.textMain}`}>{new Date(day.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-bold ${styles.textMain}`}>{day.totals?.cals || 0}</span>
                                            <span className={`text-xs font-medium ${styles.textSec}`}>kcal</span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] font-bold opacity-60">
                                            <span className="text-blue-500">P: {day.totals?.pro || 0}g</span>
                                            <span className="text-green-500">C: {day.totals?.carb || 0}g</span>
                                            <span className="text-orange-500">F: {day.totals?.fat || 0}g</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex flex-col items-end gap-1`}>
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${day.totals?.cals >= 2000 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                        {day.totals?.cals >= 2000 ? 'Goal Met' : 'Under'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`text-center py-12 rounded-[2rem] border border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
                            <Calendar className="text-gray-400" />
                        </div>
                        <p className={styles.textSec}>No logs found yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Start tracking today!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiaryView;
