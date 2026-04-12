import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { activityEmoji } from '../hooks/useWorkoutHistory';
import { db } from '../firebase.js';

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function calcPace(durationSecs, distanceKm) {
    if (!distanceKm || distanceKm === 0) return '0:00';
    const paceSecs = durationSecs / distanceKm;
    const m = Math.floor(paceSecs / 60);
    const sec = Math.floor(paceSecs % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

const WorkoutSessionDetailPage = ({ sessionId, setCurrentView }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        const fetchSession = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'activities', sessionId));
                if (docSnap.exists()) {
                    setSession({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error("Error fetching session:", e);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pb-20 absolute inset-0 z-[200]">
                <div className="w-8 h-8 border-4 border-[#ff5733] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (notFound || !session) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 absolute inset-0 z-[200]">
                <div className="text-4xl mb-4">🤷</div>
                <div className="text-white text-lg font-bold mb-4">Session not found</div>
                <button 
                    onClick={() => setCurrentView('workout')}
                    className="bg-[#222] text-white px-6 py-2 rounded-xl font-semibold active:bg-[#333]"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24 overflow-y-auto absolute inset-0 z-[200]">
            {/* TOP BAR */}
            <div className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-50">
                <button 
                    onClick={() => setCurrentView('workout')}
                    className="bg-[#222] rounded-full w-9 h-9 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-xl font-bold text-white capitalize">
                    {session.activityType} Session
                </div>
            </div>

            {/* MAP */}
            {session.type === 'gps' && session.route && session.route.length > 1 && (
                <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative z-0" style={{ height: '220px' }}>
                    <MapContainer
                        center={session.route[0]}
                        zoom={15}
                        zoomControl={false}
                        attributionControl={false}
                        scrollWheelZoom={false}
                        dragging={false}
                        className="w-full h-full"
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Polyline positions={session.route} pathOptions={{ color: '#22c55e', weight: 4 }} />
                        <CircleMarker center={session.route[0]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }} radius={6} />
                        <CircleMarker center={session.route[session.route.length - 1]} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }} radius={6} />
                    </MapContainer>
                </div>
            )}

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
                <div className="bg-[#161616] rounded-2xl p-4 text-center">
                    <div className="text-[#4ade80] font-bold text-lg">{session.distance} km</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Distance</div>
                </div>
                <div className="bg-[#161616] rounded-2xl p-4 text-center">
                    <div className="text-[#fbbf24] font-bold text-lg">{session.steps || Math.round(session.distance * 1350)}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Steps</div>
                </div>
                <div className="bg-[#161616] rounded-2xl p-4 text-center">
                    <div className="text-[#60a5fa] font-bold text-lg">{session.type === 'gps' ? formatTime(session.duration) : `${session.duration} min`}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Duration</div>
                </div>
                <div className="bg-[#161616] rounded-2xl p-4 text-center">
                    <div className="text-[#ff5733] font-bold text-lg">{session.caloriesBurned} kcal</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Burned</div>
                </div>
            </div>

            {/* DETAILS CARD */}
            <div className="mx-4 mb-4 bg-[#161616] rounded-2xl p-4">
                <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                    <span className="text-sm text-gray-500">📅 Date</span>
                    <span className="text-sm text-white font-medium">
                        {session.date.toDate().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                    <span className="text-sm text-gray-500">⏰ Time</span>
                    <span className="text-sm text-white font-medium">
                        {session.date.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">🏷️ Type</span>
                    <span className="text-sm text-white font-medium">
                        {session.type === 'gps' ? '📍 GPS Tracked' : '✏️ Manual'}
                    </span>
                </div>
            </div>

            {/* NOTES CARD */}
            {session.notes && (
                <div className="mx-4 mb-4 bg-[#161616] rounded-2xl p-4">
                    <div className="text-sm text-gray-500 mb-1">📝 Notes</div>
                    <div className="text-white text-sm whitespace-pre-wrap">{session.notes}</div>
                </div>
            )}
        </div>
    );
};

export default WorkoutSessionDetailPage;
