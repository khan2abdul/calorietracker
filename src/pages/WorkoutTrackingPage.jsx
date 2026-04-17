import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { useGPSTracking } from '../hooks/useGPSTracking';
import { db, auth } from '../firebase.js';
import { addDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore';
import { THEMES } from '../theme';

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const MapAutoCenter = ({ routePoints, setMapInstance }) => {
    const map = useMap();
    useEffect(() => {
        if (map) setMapInstance(map);
    }, [map, setMapInstance]);

    useEffect(() => {
        if (routePoints.length > 0) {
            map.setView(routePoints[routePoints.length - 1], map.getZoom());
        }
    }, [routePoints, map]);
    return null;
};

const WorkoutTrackingPage = ({ onFinish, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;
    const [activityMode, setActivityMode] = useState('walk');
    const [showSummary, setShowSummary] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    const {
        isTracking, isPaused, routePoints, totalDistance,
        seconds, steps, currentPace, caloriesBurned, error,
        start, pause, resume, stop, reset
    } = useGPSTracking();

    const handleBack = () => {
        if (isTracking || isPaused) {
            if (window.confirm('Session in progress. Discard data?')) {
                reset();
                onFinish();
            }
        } else {
            onFinish();
        }
    };

    useEffect(() => {
        if (mapInstance) {
            navigator.geolocation.getCurrentPosition((pos) => {
                mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 16);
            }, () => {}, { enableHighAccuracy: true });
        }
    }, [mapInstance]);

    const handleSaveSession = async () => {
        if (!sessionData || isSaving) return;
        setIsSaving(true);
        try {
            if (!auth.currentUser) throw new Error("Not authenticated");
            const payload = {
                userId: auth.currentUser.uid,
                date: Timestamp.now(),
                type: 'gps',
                activityType: activityMode === 'run' ? 'running' : 'walking',
                duration: Number(sessionData.duration) || 0,
                distance: Number(sessionData.distance) || 0,
                caloriesBurned: Number(sessionData.caloriesBurned) || 0,
                steps: Number(sessionData.steps) || 0,
                notes: '',
                route: sessionData.route || [],
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'activities'), payload);
            reset();
            setShowSummary(false);
            onFinish();
        } catch (e) {
            console.error('Save failed', e);
            alert("Failed to save: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`fixed inset-0 flex flex-col z-[100] ${styles.bg}`}>
            {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-black/60 backdrop-blur-md px-4 pt-10 pb-3 flex items-center gap-3">
                <button onClick={handleBack} className="bg-white/10 rounded-full w-9 h-9 flex items-center justify-center text-white"><ChevronLeft size={20} /></button>
                <div className="flex gap-2">
                    <button disabled={isTracking || isPaused} onClick={() => setActivityMode('walk')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${activityMode === 'walk' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>Walk</button>
                    <button disabled={isTracking || isPaused} onClick={() => setActivityMode('run')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${activityMode === 'run' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>Run</button>
                </div>
            </div>

            {/* MAP SECTION */}
            <div className="flex-1 relative">
                <MapContainer center={[23.3441, 85.3096]} zoom={16} className="w-full h-full z-0" zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: '#22c55e', weight: 5 }} />}
                    {routePoints.length > 0 && <CircleMarker center={routePoints[routePoints.length - 1]} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }} radius={8} />}
                    <MapAutoCenter routePoints={routePoints} setMapInstance={setMapInstance} />
                </MapContainer>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-[2000] p-6">
                        <div className="bg-black/90 rounded-[2rem] p-8 text-center border border-white/5 w-full max-w-sm">
                            <div className="text-4xl mb-4">⚠️</div>
                            <div className="text-white font-bold text-lg mb-2">{error}</div>
                            <button className="mt-4 bg-[#ff5733] text-white rounded-xl px-8 py-3 font-bold" onClick={() => { reset(); start(activityMode === 'run' ? 'running' : 'walking'); }}>Try Again</button>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM STATS PANEL */}
            <div className={`rounded-t-[2.5rem] px-5 pt-6 pb-10 z-10 -mt-8 border-t ${styles.card} ${styles.border} shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]`}>
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <StatBox label="KM" value={totalDistance.toFixed(2)} color="text-green-500" theme={theme} styles={styles} />
                    <StatBox label="TIME" value={formatTime(seconds)} color="text-blue-500" theme={theme} styles={styles} />
                    <StatBox label="STEPS" value={steps} color="text-yellow-500" theme={theme} styles={styles} />
                    <StatBox label="KCAL" value={caloriesBurned} color="text-[#ff5733]" theme={theme} styles={styles} />
                </div>

                {!isTracking && !isPaused ? (
                    <button className="w-full py-5 bg-green-500 text-white font-black text-xl rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform" onClick={() => start(activityMode === 'run' ? 'running' : 'walking')}>▶ START SESSION</button>
                ) : isTracking ? (
                    <button className="w-full py-5 bg-yellow-500 text-white font-black text-xl rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform" onClick={pause}>⏸ PAUSE</button>
                ) : (
                    <div className="flex gap-3">
                        <button className="flex-1 py-5 bg-green-500 text-white font-black text-base rounded-2xl active:scale-95 transition-transform" onClick={resume}>▶ RESUME</button>
                        <button className="flex-1 py-5 bg-red-500 text-white font-black text-base rounded-2xl active:scale-95 transition-transform" onClick={() => { setSessionData(stop()); setShowSummary(true); }}>⏹ STOP</button>
                    </div>
                )}
            </div>

            {/* SUMMARY MODAL */}
            {showSummary && sessionData && (
                <div className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center px-6">
                    <div className={`rounded-[2.5rem] p-8 w-full max-w-sm border shadow-2xl ${styles.card} ${styles.border}`}>
                        <h2 className={`text-2xl font-black mb-6 text-center ${styles.textMain}`}>🎉 Session Complete!</h2>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <SummaryItem label="Distance" value={`${sessionData.distance} km`} styles={styles} />
                            <SummaryItem label="Steps" value={sessionData.steps} styles={styles} />
                            <SummaryItem label="Duration" value={formatTime(sessionData.duration)} styles={styles} />
                            <SummaryItem label="Calories" value={`${sessionData.caloriesBurned} kcal`} styles={styles} />
                        </div>
                        <div className="flex gap-3">
                            <button className={`flex-1 py-4 font-bold rounded-2xl ${styles.textSec} bg-gray-500/10`} onClick={() => { if (window.confirm('Discard?')) { reset(); setShowSummary(false); onFinish(); } }}>Discard</button>
                            <button className="flex-[2] py-4 bg-[#ff5733] text-white font-black rounded-2xl" onClick={handleSaveSession} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Session'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBox = ({ label, value, color, theme, styles }) => (
    <div className={`rounded-2xl p-2 text-center flex flex-col justify-center h-20 border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <span className={`text-lg font-black ${color}`}>{value}</span>
        <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${styles.textSec}`}>{label}</span>
    </div>
);

const SummaryItem = ({ label, value, styles }) => (
    <div className={`rounded-2xl p-4 text-center bg-gray-500/5 border border-dashed border-gray-500/20`}>
        <div className={`text-xl font-black text-[#ff5733]`}>{value}</div>
        <div className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${styles.textSec}`}>{label}</div>
    </div>
);

export default WorkoutTrackingPage;
