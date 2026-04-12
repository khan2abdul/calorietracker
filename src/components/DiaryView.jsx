import React, { useState, useEffect, useMemo } from 'react';
import { THEMES } from '../theme';
import { db, auth } from '../firebase.js';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Calendar, Flame, Trophy, ChevronRight, TrendingUp, Award } from 'lucide-react';

const DiaryView = ({ theme, user, onDayClick }) => {
    const styles = THEMES[theme];
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Calculate date 30 days ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];

        const q = query(
            collection(db, 'users', user.uid, 'daily_logs'),
            where('__name__', '>=', startDateStr)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                const burned = docData.exercises
                    ? docData.exercises.reduce((acc, ex) => acc + (ex.calories || 0), 0)
                    : (docData.burned || 0);

                return {
                    date: doc.id,
                    ...docData,
                    burned
                };
            });

            // Sort by date desc
            data.sort((a, b) => b.date.localeCompare(a.date));

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

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateStr = (date) => {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        const todayStr = getLocalDateStr(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        let streak = 0;

        // Check start of streak
        // The history is ordered by date desc (from Firestore query)
        const latestLogDate = history[0].date;

        if (latestLogDate === todayStr) {
            streak = 1;
        } else if (latestLogDate === yesterdayStr) {
            streak = 1;
        } else {
            // If the last log is older than yesterday, streak is broken
            return { streak: 0, totalDays: history.length };
        }

        // Continue checking backwards for consecutive days
        let expectedDate = new Date(latestLogDate); // Start from the latest log date found

        for (let i = 1; i < history.length; i++) {
            expectedDate.setDate(expectedDate.getDate() - 1); // Go back one day
            const expectedDateStr = getLocalDateStr(expectedDate);

            if (history[i].date === expectedDateStr) {
                streak++;
            } else {
                break; // Gap found, streak ends
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

    const MacroItem = ({ label, value, color, theme }) => (
        <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase opacity-60 ${styles.textSec}`}>{label}</span>
            <span className={`text-sm font-bold ${color}`}>{value}g</span>
        </div>
    );

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14 max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Diary</h1>
                    <p className={`text-sm font-medium ${styles.textSec} opacity-80`}>Your Journey 📜</p>
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
                    {stats.streak > 3 ? "No cap, you're crushing it! 🔥" : "Consistency is key! 🔑"}
                </p>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className={`text-lg font-bold px-1 ${styles.textMain}`}>Recent Logs</h3>

                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading receipts...</div>
                ) : history.length > 0 ? (
                    <div className="space-y-4">
                        {history.filter(day => {
                            const hasCalories = (day.totals?.cals || 0) > 0;
                            const hasBurned = (day.burned || 0) > 0;
                            const hasWater = (day.waterIntake || 0) > 0;
                            const hasFood = day.foodLogs && Object.values(day.foodLogs).some(arr => arr && arr.length > 0);
                            const hasExercises = day.exercises && day.exercises.length > 0;
                            return hasCalories || hasBurned || hasWater || hasFood || hasExercises;
                        }).map((day) => (
                            <div key={day.date} onClick={() => onDayClick(day)} className={`cursor-pointer p-5 rounded-[2rem] border transition-all hover:scale-[1.01] active:scale-95 ${theme === 'dark' ? 'bg-[#2C2C2E]/50 border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                                <div className="flex justify-between items-center mb-4 border-b pb-3 border-dashed border-gray-200/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            <span className={`text-[10px] uppercase font-bold ${styles.textSec}`}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className={`text-lg font-bold ${styles.textMain}`}>{new Date(day.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${styles.textMain}`}>{new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                                                {getVibe(day.totals?.cals || 0, day.burned || 0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black ${styles.textMain}`}>{day.totals?.cals || 0}</span>
                                        <p className={`text-[10px] font-bold uppercase ${styles.textSec}`}>Calories</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className={`p-2 rounded-xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                                        <span className={`text-[10px] font-bold uppercase text-blue-500 mb-1`}>Protein</span>
                                        <span className={`text-lg font-bold ${styles.textMain}`}>{Math.round(day.totals?.pro || 0)}g</span>
                                    </div>
                                    <div className={`p-2 rounded-xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                                        <span className={`text-[10px] font-bold uppercase text-green-500 mb-1`}>Carbs</span>
                                        <span className={`text-lg font-bold ${styles.textMain}`}>{Math.round(day.totals?.carb || 0)}g</span>
                                    </div>
                                    <div className={`p-2 rounded-xl flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-100'}`}>
                                        <span className={`text-[10px] font-bold uppercase text-orange-500 mb-1`}>Fat</span>
                                        <span className={`text-lg font-bold ${styles.textMain}`}>{Math.round(day.totals?.fat || 0)}g</span>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between pt-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                    <div className="flex items-center gap-2">
                                        <Flame size={14} className="fill-current" />
                                        <span className="text-xs font-bold uppercase">Burned</span>
                                    </div>
                                    <span className="text-sm font-bold">{day.burned || 0} kcal</span>
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
