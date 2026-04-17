import React, { useState } from 'react';
import ManualLogSheet from '../components/workout/ManualLogSheet';
import ConfirmModal from '../components/ConfirmModal';
import { useWorkoutHistory, activityEmoji, formatSessionDate } from '../hooks/useWorkoutHistory';
import { Trash2, Edit2 } from 'lucide-react';
import { THEMES } from '../theme';

const WorkoutPage = ({ onStartTracking, onSessionClick, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const [showManualSheet, setShowManualSheet] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, sessionId: null });
    
    const {
        sessions, loading, loadingMore, hasMore,
        loadMore, deleteSession, weeklyStats, weeklyLoading
    } = useWorkoutHistory();

    const today = new Date();
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', dateOptions);

    return (
        <div className={`min-h-screen pb-20 overflow-y-auto ${styles.bg}`}>
            {/* ── SECTION 1: HEADER ── */}
            <div className="px-5 pt-6 pb-2 flex justify-between items-start">
                <div>
                    <h1 className={`text-2xl font-bold ${styles.textMain}`}>Workout 🏃</h1>
                    <p className={`text-sm ${styles.textSec} mt-1`}>{formattedDate}</p>
                </div>
            </div>

            {/* ── SECTION 2: WEEKLY SUMMARY STRIP ── */}
            <div className={`mx-4 mb-4 rounded-2xl p-4 border ${styles.card} ${styles.border}`}>
                <div className={`grid grid-cols-3 divide-x ${styles.border}`}>
                    <div className="flex flex-col items-center py-1">
                        {weeklyLoading ? <div className="h-6 w-12 bg-gray-500/20 rounded animate-pulse mx-auto" /> : <span className="text-xl font-bold text-[#ff5733]">{weeklyStats.sessions}</span>}
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${styles.textSec}`}>SESSIONS</span>
                    </div>
                    <div className="flex flex-col items-center py-1 overflow-hidden">
                        {weeklyLoading ? <div className="h-6 w-12 bg-gray-500/20 rounded animate-pulse mx-auto" /> : <span className="text-xl font-bold text-[#ff5733] whitespace-nowrap">{weeklyStats.km} km</span>}
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${styles.textSec}`}>THIS WEEK</span>
                    </div>
                    <div className="flex flex-col items-center py-1 overflow-hidden">
                        {weeklyLoading ? <div className="h-6 w-12 bg-gray-500/20 rounded animate-pulse mx-auto" /> : <span className="text-xl font-bold text-[#ff5733] whitespace-nowrap">{weeklyStats.kcal}</span>}
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${styles.textSec}`}>BURNED</span>
                    </div>
                </div>
            </div>

            {/* ── SECTION 3: TWO CTA CARDS ── */}
            <div className="flex gap-3 mx-4 mb-5">
                <div className={`flex-1 rounded-2xl p-4 min-h-[160px] flex flex-col border ${theme === 'dark' ? 'bg-[#0d2e1a] border-[#2a7a40]' : 'bg-green-50 border-green-200'}`}>
                    <div className="text-3xl mb-2">📍</div>
                    <div className={`${theme === 'dark' ? 'text-[#4ade80]' : 'text-green-700'} font-bold text-sm mb-1`}>Start Tracking</div>
                    <div className={`text-[11px] leading-4 flex-1 ${theme === 'dark' ? 'text-gray-400' : 'text-green-600/70'}`}>Live GPS map with auto calorie burn</div>
                    <button 
                        className={`mt-4 font-bold text-sm rounded-xl py-2 w-full transition-transform active:scale-95 ${theme === 'dark' ? 'bg-[#22c55e] text-black' : 'bg-green-500 text-white'}`}
                        onClick={onStartTracking}
                    >
                        ▶ Start GPS
                    </button>
                </div>

                <div className={`flex-1 rounded-2xl p-4 min-h-[160px] flex flex-col border ${theme === 'dark' ? 'bg-[#0d1e3a] border-[#2a4a8a]' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="text-3xl mb-2">✏️</div>
                    <div className={`${theme === 'dark' ? 'text-[#60a5fa]' : 'text-blue-700'} font-bold text-sm mb-1`}>Log Activity</div>
                    <div className={`text-[11px] leading-4 flex-1 ${theme === 'dark' ? 'text-gray-400' : 'text-blue-600/70'}`}>Manually log any workout</div>
                    <button 
                        className={`mt-4 font-bold text-sm rounded-xl py-2 w-full transition-transform active:scale-95 ${theme === 'dark' ? 'bg-[#3b82f6] text-white' : 'bg-blue-500 text-white'}`}
                        onClick={() => { setEditingSession(null); setShowManualSheet(true); }}
                    >
                        + Log Now
                    </button>
                </div>
            </div>

            <div className={`text-base font-bold px-4 pb-3 ${styles.textMain}`}>Recent Sessions</div>
            
            {loading ? (
                <div className="px-4 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className={`h-24 rounded-2xl animate-pulse ${styles.card} opacity-60`} />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className={`mx-4 rounded-2xl p-8 flex flex-col items-center justify-center border border-dashed ${styles.border}`}>
                    <div className="text-5xl mb-3">🏃</div>
                    <div className={`font-semibold text-base mb-1 ${styles.textMain}`}>No workouts yet</div>
                    <p className={`text-sm text-center ${styles.textSec}`}>Start moving! Your sessions will appear here.</p>
                </div>
            ) : (
                <div className="px-4 space-y-3">
                    {sessions.map(session => {
                        const finalDuration = session.type === 'gps' ? Math.ceil(session.duration / 60) : session.duration;
                        const distStr = session.distance > 0 ? `${session.distance} km • ` : '';
                        return (
                            <div 
                                key={session.id}
                                className={`rounded-2xl p-4 flex items-center gap-4 border transition-all active:scale-[0.98] ${styles.card} ${styles.border}`}
                                onClick={() => { if (session.type === 'gps') onSessionClick(session.id); }}
                            >
                                <div className="text-3xl w-10 text-center flex-shrink-0">{activityEmoji[session.activityType] || '⚡'}</div>
                                <div className="flex-1">
                                    <div className={`font-bold text-sm capitalize ${styles.textMain}`}>{session.activityType}</div>
                                    <div className={`text-xs mt-1 ${styles.textSec}`}>{formatSessionDate(session.date)} • {distStr}{finalDuration} min</div>
                                    <div className="mt-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${session.type === 'gps' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {session.type === 'gps' ? '📍 GPS' : '✏️ Manual'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-[#ff5733] font-black text-sm">{session.caloriesBurned} kcal</div>
                                    <div className="flex gap-2">
                                        {session.type === 'manual' && (
                                            <button onClick={(e) => { e.stopPropagation(); setEditingSession(session); setShowManualSheet(true); }} className={`${styles.textSec} hover:text-blue-500`}><Edit2 size={14} /></button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, sessionId: session.id }); }} className={`${styles.textSec} hover:text-red-500`}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {hasMore && (
                <button onClick={loadMore} disabled={loadingMore} className={`mx-4 mt-4 w-[calc(100%-32px)] py-3 rounded-2xl text-sm font-bold border transition-colors ${styles.card} ${styles.border} ${styles.textSec}`}>
                    {loadingMore ? 'Loading...' : 'Load More Sessions'}
                </button>
            )}

            <ManualLogSheet isOpen={showManualSheet} onClose={() => setShowManualSheet(false)} editActivity={editingSession} theme={theme} />
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
