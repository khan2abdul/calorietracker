import React, { useState, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { getLocalDateStr } from '../../utils';

const MOODS = ['😔', '😐', '😊', '😄', '🤩'];
const MEAL_LABELS = { Breakfast: '🌅 Breakfast', Lunch: '🥗 Lunch', Dinner: '🌙 Dinner', Snacks: '🍿 Snacks' };

const getRelativeLabel = (dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
};

const JournalTab = ({ history, user, tc, theme, G_CALS, stats, onDayClick }) => {
    const [draftNotes, setDraftNotes] = useState({});
    const [draftMoods, setDraftMoods] = useState({});

    const journalDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = getLocalDateStr(d);
            const log = history.find(h => h.date === dStr);
            days.push({ dateObj: d, dateStr: dStr, log });
        }
        return days;
    }, [history]);

    const saveMood = async (dateStr, mood) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), { mood, updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const saveNote = async (dateStr, note) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), { note, updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const handleMood = (dateStr, mood) => {
        setDraftMoods(prev => ({ ...prev, [dateStr]: mood }));
        saveMood(dateStr, mood);
    };

    const handleNoteChange = (dateStr, value) => {
        setDraftNotes(prev => ({ ...prev, [dateStr]: value }));
    };

    const handleNoteBlur = (dateStr) => {
        const value = draftNotes[dateStr];
        if (value !== undefined) saveNote(dateStr, value);
    };

    const getDayStatusColor = (cals) => {
        if (!cals) return 'border-white/10';
        if (cals > G_CALS) return 'border-amber-400';
        return 'border-emerald-400';
    };

    const getDayBadgeStyle = (cals) => {
        if (!cals) return { backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' };
        if (cals > G_CALS) return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' };
        return { backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' };
    };

    const getMood = (day) => draftMoods[day.dateStr] ?? day.log?.mood ?? null;
    const getNote = (day) => draftNotes[day.dateStr] ?? day.log?.note ?? '';

    const showMilestone = stats.streak >= 3;

    return (
        <div className="space-y-3">
            {journalDays.map((day, idx) => {
                const isLogged = !!day.log && ((day.log.totals?.cals || 0) > 0 || day.log.weight > 0 || day.log.foodLogs);
                const cals = Math.round(day.log?.totals?.cals || 0);
                const dateFmt = day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const meals = day.log?.foodLogs ? Object.keys(day.log.foodLogs).filter(k => Array.isArray(day.log.foodLogs[k]) && day.log.foodLogs[k].length > 0) : [];

                return (
                    <React.Fragment key={day.dateStr}>
                        {idx === 1 && showMilestone && (
                            <div className="milestone-card rounded-2xl p-4 text-center my-3">
                                <div className="text-2xl mb-1">🎉</div>
                                <p className="text-sm font-bold text-white">{stats.streak}-Day Streak Achieved!</p>
                                <p className="text-xs text-white/40 mt-1">You logged every single day. Keep it up!</p>
                                <div className="mt-2 flex justify-center gap-1 text-lg">
                                    {Array.from({ length: Math.min(stats.streak, 7) }).map((_, i) => (
                                        <span key={i}>🔥</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLogged ? (
                            <div className={`rounded-2xl p-4 border-l-4 ${getDayStatusColor(cals)}`} style={{ backgroundColor: tc.glassBg, borderRight: `1px solid ${tc.glassBorder}`, borderTop: `1px solid ${tc.glassBorder}`, borderBottom: `1px solid ${tc.glassBorder}` }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: tc.textMain }}>{dateFmt}</p>
                                        <p className="text-xs" style={{ color: tc.textMuted }}>{getRelativeLabel(day.dateObj)}</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={getDayBadgeStyle(cals)}>
                                        {cals} kcal {cals > G_CALS && '🏆'}
                                    </span>
                                </div>

                                {meals.length > 0 && (
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {meals.map(meal => (
                                            <span key={meal} className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/50">
                                                {MEAL_LABELS[meal] || meal}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <p className="text-xs mb-2" style={{ color: tc.textFaint }}>How are you feeling?</p>
                                    <div className="flex gap-2">
                                        {MOODS.map(m => (
                                            <button key={m} className={`mood-btn ${getMood(day) === m ? 'selected' : ''}`} onClick={() => handleMood(day.dateStr, m)}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    className="note-input"
                                    rows={2}
                                    placeholder="Add a note about today..."
                                    value={getNote(day)}
                                    onChange={(e) => handleNoteChange(day.dateStr, e.target.value)}
                                    onBlur={() => handleNoteBlur(day.dateStr)}
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl p-4 border border-dashed flex items-center justify-between my-2" style={{ borderColor: tc.glassBorder }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: tc.textFaint }}>{dateFmt}</p>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>Not logged</p>
                                </div>
                                <button
                                    onClick={() => onDayClick && onDayClick({ dateObj: day.dateObj, stats: null })}
                                    className="text-xs px-3 py-1.5 rounded-xl transition hover:text-emerald-400 hover:border-emerald-400/30"
                                    style={{ backgroundColor: tc.pillBg, color: tc.textFaint, border: `1px solid ${tc.glassBorder}` }}
                                >
                                    + Log day
                                </button>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default JournalTab;
