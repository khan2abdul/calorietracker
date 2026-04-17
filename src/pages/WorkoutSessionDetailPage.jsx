import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, MapPin, Calendar, Clock, Activity } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { activityEmoji } from '../hooks/useWorkoutHistory';
import { db } from '../firebase.js';
import { THEMES } from '../theme';

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const WorkoutSessionDetailPage = ({ sessionId, onBack, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!sessionId) { setNotFound(true); setLoading(false); return; }
        const fetchSession = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'activities', sessionId));
                if (docSnap.exists()) setSession({ id: docSnap.id, ...docSnap.data() });
                else setNotFound(true);
            } catch (e) { console.error(e); setNotFound(true); } finally { setLoading(false); }
        };
        fetchSession();
    }, [sessionId]);

    if (loading) return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${styles.bg}`}>
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span className={`text-xs font-bold uppercase tracking-widest ${styles.textSec}`}>Fetching Details...</span>
        </div>
    );

    if (notFound || !session) return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${styles.bg}`}>
            <div className="text-5xl mb-6">🤷</div>
            <h2 className={`text-xl font-bold mb-6 ${styles.textMain}`}>Session not found</h2>
            <button onClick={onBack} className={`px-8 py-3 rounded-2xl font-bold ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>Go Back</button>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-[200] overflow-y-auto ${styles.bg}`}>
            {/* TOP BAR */}
            <div className={`sticky top-0 z-50 px-4 pt-12 pb-4 flex items-center gap-4 border-b backdrop-blur-md ${theme === 'dark' ? 'bg-black/60 border-white/5' : 'bg-white/60 border-gray-100'}`}>
                <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'}`}><ChevronLeft size={20} /></button>
                <h1 className={`text-xl font-black capitalize ${styles.textMain}`}>{session.activityType} Session</h1>
            </div>

            {/* MAP VIEW */}
            {session.type === 'gps' && session.route && session.route.length > 1 && (
                <div className="mx-4 mt-6 mb-6 rounded-[2.5rem] overflow-hidden border border-white/5 relative z-0 h-[240px] shadow-xl">
                    <MapContainer center={session.route[0]} zoom={15} zoomControl={false} attributionControl={false} dragging={true} className="w-full h-full">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Polyline positions={session.route} pathOptions={{ color: '#22c55e', weight: 4 }} />
                        <CircleMarker center={session.route[0]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }} radius={6} />
                        <CircleMarker center={session.route[session.route.length - 1]} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }} radius={6} />
                    </MapContainer>
                </div>
            )}

            {/* KEY STATS */}
            <div className="grid grid-cols-2 gap-4 mx-4 mb-6">
                <HighlightCard label="Distance" value={`${session.distance} km`} color="text-green-500" theme={theme} styles={styles} />
                <HighlightCard label="Steps" value={session.steps || '--'} color="text-blue-500" theme={theme} styles={styles} />
                <HighlightCard label="Duration" value={session.type === 'gps' ? formatTime(session.duration) : `${session.duration} min`} color="text-yellow-500" theme={theme} styles={styles} />
                <HighlightCard label="Burned" value={`${session.caloriesBurned} kcal`} color="text-red-500" theme={theme} styles={styles} />
            </div>

            {/* DETAILED INFO */}
            <div className={`mx-4 mb-10 rounded-[2.5rem] p-6 border ${styles.card} ${styles.border}`}>
                <div className="space-y-5">
                    <DetailRow icon={<Calendar size={18} />} label="Date" value={session.date.toDate().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} styles={styles} />
                    <DetailRow icon={<Clock size={18} />} label="Time" value={session.date.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} styles={styles} />
                    <DetailRow icon={<Activity size={18} />} label="Source" value={session.type === 'gps' ? '📍 GPS Tracked' : '✏️ Manual Entry'} styles={styles} />
                </div>
            </div>

            {session.notes && (
                <div className={`mx-4 mb-10 rounded-[2.5rem] p-6 border ${styles.card} ${styles.border}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${styles.textSec}`}>Notes</h3>
                    <p className={`text-sm leading-relaxed ${styles.textMain}`}>{session.notes}</p>
                </div>
            )}
        </div>
    );
};

const HighlightCard = ({ label, value, color, theme, styles }) => (
    <div className={`p-5 rounded-[2rem] border text-center transition-transform hover:scale-[1.02] ${styles.card} ${styles.border}`}>
        <div className={`text-2xl font-black mb-1 ${color}`}>{value}</div>
        <div className={`text-[10px] font-bold uppercase tracking-widest ${styles.textSec}`}>{label}</div>
    </div>
);

const DetailRow = ({ icon, label, value, styles }) => (
    <div className="flex items-center justify-between pb-4 border-b border-dashed border-gray-500/10 last:border-0 last:pb-0">
        <div className="flex items-center gap-3">
            <div className={`${styles.textSec}`}>{icon}</div>
            <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSec}`}>{label}</span>
        </div>
        <span className={`text-sm font-bold ${styles.textMain}`}>{value}</span>
    </div>
);

export default WorkoutSessionDetailPage;
