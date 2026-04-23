import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase.js';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';

import { getLocalDateStr } from '../utils';
import { THEMES } from '../theme';
import OverviewTab from './Diary/OverviewTab';
import JournalTab from './Diary/JournalTab';
import InsightsTab from './Diary/InsightsTab';

const DiaryView = ({ theme, user, toggleTheme, onDayClick }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [activeMonth, setActiveMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('Overview');
    const [yearData, setYearData] = useState([]);

    const styles = THEMES[theme] || THEMES.dark;
    const isDark = theme === 'dark';

    const tc = useMemo(() => {
        if (theme === 'dark') {
            return {
                bg: '#0a0a0a',
                headerBg: 'rgba(10,10,10,0.85)',
                glassBg: 'rgba(255,255,255,0.03)',
                glassBorder: 'rgba(255,255,255,0.06)',
                textMain: '#ffffff',
                textSec: 'rgba(255,255,255,0.5)',
                textMuted: 'rgba(255,255,255,0.35)',
                textFaint: 'rgba(255,255,255,0.25)',
                pillBg: 'rgba(255,255,255,0.05)',
                ringTrack: 'rgba(255,255,255,0.06)',
                navBlur: 'rgba(10,10,10,0.85)',
            };
        }
        if (theme === 'wooden') {
            return {
                bg: '#C19A6B',
                headerBg: 'rgba(193,154,107,0.9)',
                glassBg: 'rgba(234,221,202,0.9)',
                glassBorder: 'rgba(62,39,35,0.12)',
                textMain: '#3E2723',
                textSec: 'rgba(62,39,35,0.6)',
                textMuted: 'rgba(62,39,35,0.4)',
                textFaint: 'rgba(62,39,35,0.25)',
                pillBg: 'rgba(62,39,35,0.06)',
                ringTrack: 'rgba(62,39,35,0.1)',
                navBlur: 'rgba(193,154,107,0.9)',
            };
        }
        return {
            bg: '#F2F2F7',
            headerBg: 'rgba(242,242,247,0.9)',
            glassBg: '#ffffff',
            glassBorder: 'rgba(0,0,0,0.08)',
            textMain: '#0f172a',
            textSec: 'rgba(0,0,0,0.5)',
            textMuted: 'rgba(0,0,0,0.35)',
            textFaint: 'rgba(0,0,0,0.25)',
            pillBg: 'rgba(0,0,0,0.04)',
            ringTrack: 'rgba(0,0,0,0.08)',
            navBlur: 'rgba(242,242,247,0.9)',
        };
    }, [theme]);

    useEffect(() => {
        if (!user) return;

        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) setUserStats(docSnap.data());
        });

        const startDate = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const startTime = startDate.getTime();
        const startDateStr = startDate.toISOString().split('T')[0];

        const qLogs = query(collection(db, 'users', user.uid, 'daily_logs'), where('__name__', '>=', startDateStr));
        const qActivities = query(collection(db, 'activities'), where('userId', '==', user.uid));

        let logsData = [];
        let activitiesData = [];

        const updateCombined = () => {
            const daysMap = {};
            logsData.forEach(day => { daysMap[day.date] = { ...day, burned: day.burned || 0 }; });
            activitiesData.forEach(act => {
                if (!act.date) return;
                let date = typeof act.date.toDate === 'function' ? act.date.toDate() : new Date(act.date);
                if (date.getTime() < startTime) return;
                const dateStr = getLocalDateStr(date);
                if (!daysMap[dateStr]) {
                    daysMap[dateStr] = { date: dateStr, totals: { cals: 0, pro: 0, carb: 0, fat: 0 }, burned: 0, foodLogs: {}, isVirtual: true };
                }
                daysMap[dateStr].burned += (Number(act.caloriesBurned) || 0);
            });
            const merged = Object.values(daysMap).sort((a, b) => b.date.localeCompare(a.date));
            setHistory(merged);
            setLoading(false);
        };

        const unsubLogs = onSnapshot(qLogs, (snap) => { logsData = snap.docs.map(d => ({ date: d.id, ...d.data() })); updateCombined(); });
        const unsubActs = onSnapshot(qActivities, (snap) => { activitiesData = snap.docs.map(d => ({ id: d.id, ...d.data() })); updateCombined(); });

        return () => { unsubUser(); unsubLogs(); unsubActs(); };
    }, [user, activeMonth]);

    useEffect(() => {
        if (!user) return;
        const year = new Date().getFullYear();
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        const q = query(
            collection(db, 'users', user.uid, 'daily_logs'),
            where('__name__', '>=', start),
            where('__name__', '<=', end)
        );
        const unsub = onSnapshot(q, (snap) => {
            setYearData(snap.docs.map(d => ({ date: d.id, ...d.data() })));
        });
        return unsub;
    }, [user]);

    const G_CALS = userStats?.goalCals || 2000;
    const todayStr = getLocalDateStr(new Date());
    const userName = user?.displayName?.split(' ')[0] || 'User';

    const stats = useMemo(() => {
        if (!history.length) return { streak: 0, longest: 0 };
        const todayStr = getLocalDateStr(new Date());
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        let streak = 0;
        let longest = 0;
        let currentStreak = 0;

        const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
        
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].totals?.cals > 0) {
                if (i === 0 || new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime() <= 86400000 * 1.5) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 0;
            }
            if (currentStreak > longest) longest = currentStreak;
            if (sorted[i].date === todayStr || sorted[i].date === yesterdayStr) {
                 streak = currentStreak;
            }
        }
        
        return { streak, longest: longest > streak ? longest : streak };
    }, [history]);

    const tabs = ['Overview', 'Journal', 'Insights'];
    const glassCard = isDark
        ? 'backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]'
        : 'bg-white border border-black/[0.08]';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen animate-fade-in" style={{ backgroundColor: tc.bg, maxWidth: '430px', margin: '0 auto' }}>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-sm font-medium opacity-50" style={{ color: tc.textMain }}>Loading diary...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-32 animate-fade-in relative" style={{ backgroundColor: tc.bg, maxWidth: '448px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Noise texture overlay */}
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '128px 128px',
                maxWidth: '448px',
                margin: '0 auto',
                left: '0',
                right: '0'
            }} />

            <div className="px-4 pt-5 pb-2 relative z-10 space-y-5">
                {/* ══ HEADER ══ */}
                <div>
                    <h1 className="text-[28px] font-black leading-tight" style={{ color: tc.textMain }}>Diary</h1>
                    <p className="text-sm mt-0.5" style={{ color: tc.textMuted }}>Your Journey</p>
                </div>

                {/* ══ TAB SWITCHER ══ */}
                <div className={`rounded-2xl p-1 flex gap-0.5 ${glassCard}`}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                                backgroundColor: activeTab === tab ? (isDark ? 'rgba(255,255,255,0.08)' : '#000') : 'transparent',
                                color: activeTab === tab ? (isDark ? '#fff' : '#fff') : tc.textMuted,
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'Overview' && (
                    <OverviewTab
                        history={history}
                        activeMonth={activeMonth}
                        setActiveMonth={setActiveMonth}
                        todayStr={todayStr}
                        G_CALS={G_CALS}
                        tc={tc}
                        theme={theme}
                        onDayClick={onDayClick}
                        stats={stats}
                        userName={userName}
                    />
                )}

                {activeTab === 'Journal' && (
                    <JournalTab
                        history={history}
                        user={user}
                        tc={tc}
                        theme={theme}
                        G_CALS={G_CALS}
                        stats={stats}
                        onDayClick={onDayClick}
                    />
                )}

                {activeTab === 'Insights' && (
                    <InsightsTab
                        history={history}
                        yearData={yearData}
                        userStats={userStats}
                        tc={tc}
                        theme={theme}
                        G_CALS={G_CALS}
                    />
                )}
            </div>
        </div>
    );
};

export default DiaryView;
