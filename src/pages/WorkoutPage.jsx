import React, { useState } from 'react';
import ManualLogSheet from '../components/workout/ManualLogSheet';
import ConfirmModal from '../components/ConfirmModal';
import { useWorkoutHistory, activityEmoji, formatSessionDate } from '../hooks/useWorkoutHistory';
import { Trash2, Edit2 } from 'lucide-react';

const WorkoutPage = ({ setCurrentView, setSelectedSessionId }) => {
    const [showManualSheet, setShowManualSheet] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, sessionId: null });
    
    const {
        sessions, loading, loadingMore, hasMore,
        loadMore, deleteSession, weeklyStats, weeklyLoading
    } = useWorkoutHistory();

    // Format today's date "Sunday, April 12"
    const today = new Date();
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', dateOptions);

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20 overflow-y-auto">
            {/* ── SECTION 1: HEADER ── */}
            <div className="px-5 pt-6 pb-2 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white">Workout 🏃</h1>
                    <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
                </div>
            </div>

            {/* ── SECTION 2: WEEKLY SUMMARY STRIP ── */}
            <div className="mx-4 mb-4 bg-[#161616] rounded-2xl p-4">
                <div className="grid grid-cols-3 divide-x divide-[#2a2a2a]">
                    <div className="flex flex-col items-center py-1">
                        {weeklyLoading ? <div className="h-6 w-12 bg-[#2a2a2a] rounded animate-pulse mx-auto opacity-50" /> : <span className="text-xl font-bold text-[#ff5733]">{weeklyStats.sessions}</span>}
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">SESSIONS</span>
                    </div>
                    <div className="flex flex-col items-center py-1">
                        {weeklyLoading ? <div className="h-6 w-12 bg-[#2a2a2a] rounded animate-pulse mx-auto opacity-50" /> : <span className="text-xl font-bold text-[#ff5733]">{weeklyStats.km} km</span>}
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">THIS WEEK</span>
                    </div>
                    <div className="flex flex-col items-center py-1">
                        {weeklyLoading ? <div className="h-6 w-12 bg-[#2a2a2a] rounded animate-pulse mx-auto opacity-50" /> : <span className="text-xl font-bold text-[#ff5733]">{weeklyStats.kcal} kcal</span>}
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">BURNED</span>
                    </div>
                </div>
            </div>

            {/* ── SECTION 3: TWO CTA CARDS ── */}
            <div className="flex gap-3 mx-4 mb-5">
                {/* CARD 1 — Start Tracking */}
                <div className="flex-1 bg-[#0d2e1a] border border-[#2a7a40] rounded-2xl p-4 min-h-[165px] flex flex-col">
                    <div className="text-3xl mb-2">📍</div>
                    <div className="text-[#4ade80] font-bold text-sm mb-1">Start Tracking</div>
                    <div className="text-xs text-gray-500 leading-4 flex-1">Live GPS map with auto calorie burn</div>
                    <button 
                        className="mt-3 bg-[#22c55e] text-black font-bold text-sm rounded-xl py-2 w-full"
                        onClick={() => setCurrentView('workout_tracking')}
                    >
                        ▶ Start GPS
                    </button>
                </div>

                {/* CARD 2 — Log Activity */}
                <div className="flex-1 bg-[#0d1e3a] border border-[#2a4a8a] rounded-2xl p-4 min-h-[165px] flex flex-col">
                    <div className="text-3xl mb-2">✏️</div>
                    <div className="text-[#60a5fa] font-bold text-sm mb-1">Log Activity</div>
                    <div className="text-xs text-gray-500 leading-4 flex-1">Manually log any workout</div>
                    <button 
                        className="mt-3 bg-[#3b82f6] text-white font-bold text-sm rounded-xl py-2 w-full"
                        onClick={() => {
                            setEditingSession(null);
                            setShowManualSheet(true);
                        }}
                    >
                        + Log Now
                    </button>
                    {/* Placeholder for Phase 2 */}
                    <ManualLogSheet 
                        isOpen={showManualSheet} 
                        onClose={() => setShowManualSheet(false)} 
                        editActivity={editingSession}
                    />
                </div>
            </div>

            {/* ── SECTION 4: RECENT SESSIONS ── */}
            <div className="text-base font-bold text-gray-300 px-4 pb-3">
                Recent Sessions
            </div>
            
            {loading ? (
                <>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="mx-4 mb-3 bg-[#161616] rounded-2xl p-4 animate-pulse opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#2a2a2a] rounded-full" />
                                <div className="flex-1">
                                    <div className="h-4 bg-[#2a2a2a] rounded w-24 mb-2" />
                                    <div className="h-3 bg-[#2a2a2a] rounded w-36" />
                                </div>
                                <div className="h-5 bg-[#2a2a2a] rounded w-16" />
                            </div>
                        </div>
                    ))}
                </>
            ) : sessions.length === 0 ? (
                <div className="mx-4 bg-[#161616] rounded-2xl p-8 flex flex-col items-center justify-center">
                    <div className="text-5xl mb-3">🏃</div>
                    <div className="text-white font-semibold text-base mb-1">No workouts yet</div>
                    <div className="text-sm text-gray-500 text-center">Start moving! Your sessions will appear here.</div>
                </div>
            ) : (
                <>
                    {sessions.map(session => {
                        // calculate accurate duration based on type limits
                        const finalDuration = session.type === 'gps' ? Math.ceil(session.duration / 60) : session.duration;
                        const distStr = session.distance > 0 ? `${session.distance} km • ` : '';

                        return (
                            <div 
                                key={session.id}
                                className={`mx-4 mb-3 bg-[#161616] rounded-2xl p-4 flex items-center gap-3 ${session.type === 'gps' ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                                onClick={() => {
                                    if (session.type === 'gps') {
                                        if (setSelectedSessionId) setSelectedSessionId(session.id);
                                        setCurrentView('workout_session_detail');
                                    }
                                }}
                            >
                                <div className="text-3xl w-10 text-center flex-shrink-0">
                                    {activityEmoji[session.activityType] || '⚡'}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="text-white font-semibold text-sm capitalize">
                                        {session.activityType}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                                        {formatSessionDate(session.date)} • {distStr}{finalDuration} min
                                    </div>
                                    <div className="mt-1.5">
                                        {session.type === 'gps' ? (
                                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#1a4d2a] text-[#4ade80] font-semibold border border-[#22c55e]/20">
                                                📍 GPS Tracked
                                            </span>
                                        ) : (
                                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#1a2f5a] text-[#60a5fa] font-semibold border border-[#3b82f6]/20">
                                                ✏️ Manual
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-[#ff5733] font-bold text-sm">
                                        {session.caloriesBurned} kcal
                                    </div>
                                    <div className="flex gap-2">
                                        {session.type === 'manual' && (
                                            <button 
                                                className="text-gray-600 hover:text-blue-400 transition-colors p-1 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingSession(session);
                                                    setShowManualSheet(true);
                                                }}
                                            >
                                                <Edit2 size={15} strokeWidth={2.5}/>
                                            </button>
                                        )}
                                        <button 
                                            className="text-gray-600 hover:text-red-400 transition-colors p-1 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("Delete icon clicked for:", session.id);
                                                setDeleteConfirm({ isOpen: true, sessionId: session.id });
                                            }}
                                        >
                                            <Trash2 size={15} strokeWidth={2.5}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="mx-4 mt-2 mb-4 w-[calc(100%-32px)] py-3 bg-[#161616] border border-[#2a2a2a] rounded-2xl text-gray-400 text-sm font-semibold transition-colors active:bg-[#222]"
                        >
                            {loadingMore ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </span>
                            ) : 'Load More Sessions'}
                        </button>
                    )}
                </>
            )}
            <ConfirmModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Session?"
                message="This will permanently remove this activity from your history. This action cannot be undone."
                onConfirm={() => {
                    deleteSession(deleteConfirm.sessionId);
                    setDeleteConfirm({ isOpen: false, sessionId: null });
                }}
                onCancel={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
            />
        </div>
    );
};

export default WorkoutPage;
