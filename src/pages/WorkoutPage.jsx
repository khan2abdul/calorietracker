import React, { useState, useMemo } from 'react';
import ManualLogSheet from '../components/workout/ManualLogSheet';
import ConfirmModal from '../components/ConfirmModal';
import { useWorkoutHistory, activityEmoji, formatSessionDate } from '../hooks/useWorkoutHistory';
import { Trash2, Edit2 } from 'lucide-react';
import { THEMES } from '../theme';

const QUICK_ACTIVITIES = [
    { name: 'Walk', emoji: '🚶' },
    { name: 'Run', emoji: '🏃' },
    { name: 'Cycle', emoji: '🚴' },
    { name: 'Yoga', emoji: '🧘' },
    { name: 'Swim', emoji: '🏊' },
    { name: 'Custom', emoji: '⚙️' },
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WorkoutPage = ({ onStartTracking, onSessionClick, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const isDark = theme === 'dark';
    const [showManualSheet, setShowManualSheet] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, sessionId: null });
    const [quickLogActivity, setQuickLogActivity] = useState(null);

    const {
        sessions, allSessions, loading, loadingMore, hasMore,
        loadMore, deleteSession, weeklyStats, weeklyLoading
    } = useWorkoutHistory();

    const [selectedDayIndex, setSelectedDayIndex] = useState(null);

    // Compute week number
    const weekNumber = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        return Math.ceil(diff / (86400000 * 7));
    }, []);

    // Compute this week's sessions by day (Mon=0 ... Sun=6)
    const weekDays = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay(); // 0=Sun, 1=Mon...
        const mondayOffset = currentDay === 0 ? -6 : 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);

        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const startTime = d.getTime();
            d.setHours(23, 59, 59, 999);
            const endTime = d.getTime();

            // Find best session for this day (most calories)
            const daySessions = (allSessions || []).filter(s => {
                const t = s.date?.toMillis ? s.date.toMillis() : 0;
                return t >= startTime && t <= endTime;
            });

            const bestSession = daySessions.length
                ? daySessions.reduce((a, b) => (a.caloriesBurned > b.caloriesBurned ? a : b))
                : null;

            return {
                date: new Date(weekStart.getTime() + i * 86400000),
                session: bestSession,
                totalCals: daySessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
                totalDuration: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
                totalKm: daySessions.reduce((sum, s) => sum + (s.distance || 0), 0),
                count: daySessions.length
            };
        });
        return days;
    }, [allSessions]);

    // Compute personal records from sessions
    const records = useMemo(() => {
        if (!sessions.length) return [];
        let longest = null, longestDist = null, mostBurned = null, streak = 0;
        sessions.forEach(s => {
            const dur = s.type === 'gps' ? Math.ceil(s.duration / 60) : s.duration;
            if (!longest || dur > longest.value) longest = { value: dur, label: 'Longest', unit: 'min', date: formatSessionDate(s.date), type: s.activityType };
            if (s.distance && (!longestDist || s.distance > longestDist.value)) longestDist = { value: s.distance, label: 'Distance', unit: 'km', date: formatSessionDate(s.date), type: s.activityType };
            if (!mostBurned || s.caloriesBurned > mostBurned.value) mostBurned = { value: s.caloriesBurned, label: 'Most Burned', unit: 'kcal', date: formatSessionDate(s.date), type: s.activityType };
        });
        const recs = [];
        if (longest) recs.push({ ...longest, icon: '⏱️' });
        if (longestDist) recs.push({ ...longestDist, icon: '📏' });
        if (mostBurned) recs.push({ ...mostBurned, icon: '🔥' });
        recs.push({ value: Math.min(sessions.length, 7), label: 'Streak', unit: 'days', date: 'Current', icon: '⚡' });
        return recs;
    }, [sessions]);

    // Activity color mapping for left borders
    const activityColor = (type) => {
        const map = {
            walk: '#34d399', walking: '#34d399',
            run: '#f472b6', running: '#f472b6',
            cycle: '#22d3ee', cycling: '#22d3ee',
            gym: '#a78bfa', hiit: '#fb923c', cardio: '#f87171',
            yoga: '#818cf8', swim: '#60a5fa', swimming: '#60a5fa',
        };
        return map[type?.toLowerCase()] || '#34d399';
    };

    const handleQuickLog = (activity) => {
        setQuickLogActivity(activity);
        setEditingSession(null);
        setShowManualSheet(true);
    };

    const glassCard = isDark
        ? 'backdrop-blur-xl bg-[#1C1C1E]/80 border border-white/10'
        : 'backdrop-blur-xl bg-white/90 border border-slate-100';

    return (
        <div className={`min-h-screen pb-28 overflow-y-auto ${styles.bg}`}>
            <div className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">

                {/* ══ HERO HEADER ══ */}
                <div>
                    <div
                        className="rounded-3xl p-5 relative overflow-hidden"
                        style={{
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(249,115,22,0.08) 60%, rgba(8,8,8,0) 100%)'
                                : 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(249,115,22,0.05) 60%, rgba(255,255,255,0) 100%)',
                            border: isDark ? '1px solid rgba(52,211,153,0.15)' : '1px solid rgba(52,211,153,0.2)'
                        }}
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                            style={{ background: 'radial-gradient(circle, #34d399, transparent)', transform: 'translate(30%, -30%)' }} />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Week {weekNumber}</p>
                                <h1 className={`text-4xl font-black leading-none ${styles.textMain}`}>Workout</h1>
                                <p className={`text-sm mt-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    {weeklyStats.sessions} of <span className="text-emerald-400 font-bold">5 sessions</span> this week
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-orange-400">{weeklyStats.kcal || 0}</div>
                                <div className={`text-xs font-semibold ${isDark ? 'text-orange-400/60' : 'text-orange-500/70'}`}>kcal burned</div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>this week</div>
                            </div>
                        </div>
                        {/* Weekly goal progress bar */}
                        <div className="mt-4">
                            <div className={`flex justify-between text-xs mb-1.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                <span>Weekly goal</span>
                                <span className="text-emerald-400 font-semibold">{weeklyStats.sessions} / 5 sessions</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/6' : 'bg-gray-200'}`}>
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${Math.min((weeklyStats.sessions / 5) * 100, 100)}%`,
                                        background: 'linear-gradient(90deg, #34d399, #22d3ee)',
                                        boxShadow: '0 0 8px rgba(52,211,153,0.5)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ STATS ROW ══ */}
                <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-2xl p-3.5 text-center ${glassCard}`}>
                        <div className="text-xl mb-1">🏋️</div>
                        <div className={`text-2xl font-extrabold ${styles.textMain}`}>{weeklyLoading ? '-' : weeklyStats.sessions}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>Sessions</div>
                        <div className="text-xs text-emerald-400 mt-1 font-semibold">↑ Active</div>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-center ${glassCard}`}>
                        <div className="text-xl mb-1">📏</div>
                        <div className="text-2xl font-extrabold text-cyan-400">{weeklyLoading ? '-' : weeklyStats.km}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>km total</div>
                        <div className="text-xs text-emerald-400 mt-1 font-semibold">↑ Track</div>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-center ${glassCard}`}>
                        <div className="text-xl mb-1">⏱️</div>
                        <div className="text-2xl font-extrabold text-purple-400">
                            {weeklyLoading ? '-' : (sessions[0]?.type === 'gps' ? Math.ceil(sessions[0]?.duration / 60) : sessions[0]?.duration) || 0}
                        </div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>last min</div>
                        <div className="text-xs text-emerald-400 mt-1 font-semibold">↑ Burn</div>
                    </div>
                </div>

                {/* ══ WEEKLY VIEW ══ */}
                <div className={`rounded-3xl p-5 ${glassCard}`}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className={`font-bold text-sm ${styles.textMain}`}>This Week</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                {weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        <span className="text-xs px-3 py-1.5 rounded-full font-semibold text-emerald-400"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                            {weeklyStats.sessions} active day{weeklyStats.sessions !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Day bars */}
                    <div className="flex gap-2 items-end mb-2" style={{ height: '88px' }}>
                        {weekDays.map((dayData, idx) => {
                            const hasActivity = !!dayData.session;
                            const barHeight = hasActivity ? Math.max(20, Math.min(100, (dayData.totalCals / 600) * 100)) : 0;
                            const isSelected = selectedDayIndex === idx;
                            const isToday = dayData.date.toDateString() === new Date().toDateString();
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDayIndex(idx)}
                                    className="flex-1 flex flex-col items-center justify-end gap-1 transition-all"
                                >
                                    <span className="text-sm">{hasActivity ? (activityEmoji[dayData.session.activityType] || '⚡') : <span className="opacity-0">·</span>}</span>
                                    <div
                                        className={`w-full rounded-full overflow-hidden transition-all ${isDark ? 'bg-white/6' : 'bg-gray-100'}`}
                                        style={{ height: '56px', position: 'relative', outline: isSelected ? '2px solid #34d399' : 'none', outlineOffset: '2px' }}
                                    >
                                        {hasActivity && (
                                            <div
                                                className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500"
                                                style={{
                                                    height: `${barHeight}%`,
                                                    background: 'linear-gradient(180deg, #34d399, #22d3ee)',
                                                    boxShadow: '0 0 8px rgba(52,211,153,0.3)'
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium ${isToday ? 'text-emerald-400 font-bold' : (isDark ? 'text-white/30' : 'text-gray-400')}`}>{WEEK_DAYS[idx]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected day detail */}
                    {selectedDayIndex !== null && weekDays[selectedDayIndex] && (
                        <div className={`mt-4 pt-4 animate-fade-in`} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold" style={{ color: tc.textMain }}>
                                    {weekDays[selectedDayIndex].date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                                <button
                                    onClick={() => setSelectedDayIndex(null)}
                                    className="text-[11px] font-bold transition-opacity hover:opacity-70"
                                    style={{ color: tc.textMuted }}
                                >
                                    Close
                                </button>
                            </div>
                            {weekDays[selectedDayIndex].session ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(52,211,153,0.1)' }}>
                                            {activityEmoji[weekDays[selectedDayIndex].session.activityType] || '⚡'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold capitalize" style={{ color: tc.textMain }}>{weekDays[selectedDayIndex].session.activityType}</p>
                                            <p className="text-[11px]" style={{ color: tc.textMuted }}>
                                                {weekDays[selectedDayIndex].count} session{weekDays[selectedDayIndex].count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                                            <p className="text-lg font-black text-orange-400">{Math.round(weekDays[selectedDayIndex].totalCals)}</p>
                                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: tc.textFaint }}>kcal</p>
                                        </div>
                                        <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                                            <p className="text-lg font-black text-cyan-400">{weekDays[selectedDayIndex].totalKm.toFixed(1)}</p>
                                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: tc.textFaint }}>km</p>
                                        </div>
                                        <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                                            <p className="text-lg font-black text-purple-400">{Math.round(weekDays[selectedDayIndex].totalDuration / 60)}</p>
                                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: tc.textFaint }}>min</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 gap-2">
                                    <span className="text-2xl">😴</span>
                                    <p className="text-sm font-medium" style={{ color: tc.textMuted }}>Rest day — no activity logged</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ══ QUICK LOG ══ */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`font-bold ${styles.textMain}`}>Quick Log</p>
                        <button
                            onClick={() => { setEditingSession(null); setQuickLogActivity(null); setShowManualSheet(true); }}
                            className="text-xs text-emerald-400 font-semibold hover:opacity-80"
                        >
                            All activities →
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {QUICK_ACTIVITIES.map((act) => (
                            <button
                                key={act.name}
                                onClick={() => handleQuickLog(act)}
                                className={`rounded-2xl py-4 flex flex-col items-center gap-2 transition-all active:scale-95 hover:opacity-90 ${glassCard}`}
                            >
                                <span className="text-[28px]">{act.emoji}</span>
                                <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{act.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══ PERSONAL RECORDS ══ */}
                {records.length > 0 && (
                    <div>
                        <p className={`font-bold mb-3 ${styles.textMain}`}>Personal Records 🏆</p>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {records.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className={`snap-start rounded-2xl p-4 flex-shrink-0 ${glassCard}`}
                                    style={{ minWidth: '140px', borderTop: '2px solid rgba(251,191,36,0.5)' }}
                                >
                                    <div className="text-[22px] mb-2">{rec.icon}</div>
                                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{rec.label}</p>
                                    <p className="text-2xl font-extrabold text-amber-400">
                                        {rec.value}<span className="text-sm font-medium text-amber-400/60 ml-1">{rec.unit}</span>
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-white/25' : 'text-gray-300'}`}>{rec.date}{rec.type ? ` · ${rec.type}` : ''}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══ RECENT SESSIONS ══ */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`font-bold ${styles.textMain}`}>Recent Sessions</p>
                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="text-xs text-emerald-400 font-semibold hover:opacity-80"
                            >
                                {loadingMore ? 'Loading...' : 'View all →'}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-28 rounded-2xl animate-pulse ${styles.card} opacity-60`} />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className={`rounded-2xl p-8 flex flex-col items-center justify-center border border-dashed ${styles.border}`}>
                            <div className="text-5xl mb-3">🏃</div>
                            <div className={`font-semibold text-base mb-1 ${styles.textMain}`}>No workouts yet</div>
                            <p className={`text-sm text-center ${styles.textSec}`}>Start moving! Your sessions will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {sessions.map(session => {
                                const finalDuration = session.type === 'gps' ? Math.ceil(session.duration / 60) : session.duration;
                                const distStr = session.distance > 0 ? `${session.distance} km · ` : '';
                                const color = activityColor(session.activityType);
                                return (
                                    <div
                                        key={session.id}
                                        className={`rounded-2xl p-4 transition-all active:scale-[0.98] ${glassCard}`}
                                        style={{ borderLeft: `3px solid ${color}` }}
                                        onClick={() => { if (session.type === 'gps') onSessionClick(session.id); }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0"
                                                    style={{ background: `${color}1f` }}
                                                >
                                                    {activityEmoji[session.activityType] || '⚡'}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-[15px] capitalize ${styles.textMain}`}>{session.activityType}</p>
                                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                                        {formatSessionDate(session.date)} · {distStr}{finalDuration} min
                                                    </p>
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/6 text-white/40' : 'bg-gray-100 text-gray-500'}`}>
                                                            {session.type === 'gps' ? '📍 GPS' : '✏️ Manual'}
                                                        </span>
                                                        <span
                                                            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                                                            style={{ background: `${color}1a`, color: color }}
                                                        >
                                                            {activityEmoji[session.activityType]} {session.activityType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <span
                                                    className="px-2.5 py-1 rounded-xl font-bold text-[13px]"
                                                    style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}
                                                >
                                                    {session.caloriesBurned} kcal
                                                </span>
                                                <div className="flex gap-2.5">
                                                    {session.type === 'manual' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingSession(session); setQuickLogActivity(null); setShowManualSheet(true); }}
                                                            className={`${isDark ? 'text-white/20 hover:text-white/60' : 'text-gray-300 hover:text-gray-500'} transition text-sm`}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, sessionId: session.id }); }}
                                                        className={`${isDark ? 'text-white/20 hover:text-red-400' : 'text-gray-300 hover:text-red-400'} transition text-sm`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <ManualLogSheet
                isOpen={showManualSheet}
                onClose={() => setShowManualSheet(false)}
                editActivity={editingSession}
                theme={theme}
                defaultActivity={quickLogActivity?.name}
            />
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Session?"
                message="This activity will be removed forever."
                onConfirm={() => { deleteSession(deleteConfirm.sessionId); setDeleteConfirm({ isOpen: false, sessionId: null }); }}
                onCancel={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
                theme={theme}
            />
        </div>
    );
};

export default WorkoutPage;
