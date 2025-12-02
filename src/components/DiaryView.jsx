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
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                // Calculate total burned from exercises array if not explicitly stored
                const burned = docData.exercises
                    ? docData.exercises.reduce((acc, ex) => acc + (ex.calories || 0), 0)
                    : (docData.burned || 0);

                return {
                    date: doc.id,
                    ...docData,
                    burned
                };
            });
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

    const getVibe = (cals, burned) => {
        const net = cals - burned;
        if (burned > 500) return "Main Character Energy 💅";
        if (cals < 1500) return "Skinny Legend ✨";
        if (cals > 2500 && burned > 300) return "Bulking Szn 🦍";
        return "Just Vibing 🌊";
    };

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14 max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Diary</h1>
                    <p className={`text-sm font-medium ${styles.textSec} opacity-80`}>Receipts 🧾</p>
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
                            <span className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>Streak</span>
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
                    {stats.streak > 3 ? "No cap, you're crushing it! 🔥" : "Lock in! You got this."}
                </p>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className={`text-lg font-bold px-1 ${styles.textMain}`}>The Log</h3>

                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading receipts...</div>
                ) : history.length > 0 ? (
                    <div className="space-y-3">
                        {history.map((day) => (
                            <div key={day.date} className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-[#2C2C2E]/50 border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            <span className={`text-[9px] uppercase font-bold ${styles.textSec}`}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className={`text-sm font-bold ${styles.textMain}`}>{new Date(day.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                                                {getVibe(day.totals?.cals || 0, day.burned || 0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold ${styles.textSec}`}>
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Eaten */}
                                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className={`text-[10px] font-bold uppercase ${styles.textSec}`}>Eaten</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xl font-black ${styles.textMain}`}>{day.totals?.cals || 0}</span>
                                            <span className="text-[10px] opacity-60">kcal</span>
                                        </div>
                                    </div>

                                    {/* Burned */}
                                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Flame size={10} className="text-red-500 fill-red-500" />
                                            <span className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Burned</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xl font-black ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{day.burned || 0}</span>
                                            <span className={`text-[10px] opacity-60 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>kcal</span>
                                        </div>
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
                        <p className={styles.textSec}>Ghost town here. 👻</p>
                        <p className="text-xs text-gray-400 mt-1">Log something, bestie!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiaryView;
