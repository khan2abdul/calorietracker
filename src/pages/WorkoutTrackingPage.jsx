import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { useGPSTracking } from '../hooks/useGPSTracking';
import { db, auth } from '../firebase.js';
import { addDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore';

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

const WorkoutTrackingPage = ({ setCurrentView }) => {
    const [activityMode, setActivityMode] = useState('walk'); // 'walk' | 'run'
    const [showSummary, setShowSummary] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    const {
        isTracking, isPaused, routePoints, totalDistance,
        seconds, currentPace, caloriesBurned, error,
        start, pause, resume, stop, reset
    } = useGPSTracking();

    const handleBack = () => {
        if (isTracking || isPaused) {
            if (window.confirm('Session in progress. Go back and lose your data?')) {
                reset();
                setCurrentView('workout');
            }
        } else {
            setCurrentView('workout');
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
            
            // Ensure values are numbers and not NaN
            const payload = {
                userId: auth.currentUser.uid,
                date: Timestamp.now(),
                type: 'gps',
                activityType: activityMode === 'run' ? 'running' : 'walking',
                duration: Number(sessionData.duration) || 0,
                distance: Number(sessionData.distance) || 0,
                caloriesBurned: Number(sessionData.caloriesBurned) || 0,
                notes: '',
                route: sessionData.route || [],
                createdAt: serverTimestamp()
            };

            console.log("Saving GPS session payload:", payload);
            await addDoc(collection(db, 'activities'), payload);
            
            reset();
            setShowSummary(false);
            setCurrentView('workout');
            alert("Session saved successfully!");
        } catch (e) {
            console.error('Save failed', e);
            alert("Failed to save session: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStop = () => {
        const data = stop();
        setSessionData(data);
        setShowSummary(true);
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col z-[100]">
            {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-sm px-4 pt-10 pb-3 flex items-center gap-3">
                <button 
                    onClick={handleBack}
                    className="bg-[#222] rounded-full w-9 h-9 flex items-center justify-center text-white"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2">
                    <button
                        disabled={isTracking || isPaused}
                        onClick={() => setActivityMode('walk')}
                        className={`px-4 py-1.5 rounded-full text-sm ${activityMode === 'walk' ? 'bg-[#22c55e] text-black font-bold' : 'bg-[#222] text-gray-400'} ${(isTracking || isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Walk
                    </button>
                    <button
                        disabled={isTracking || isPaused}
                        onClick={() => setActivityMode('run')}
                        className={`px-4 py-1.5 rounded-full text-sm ${activityMode === 'run' ? 'bg-[#3b82f6] text-white font-bold' : 'bg-[#222] text-gray-400'} ${(isTracking || isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Run
                    </button>
                </div>
            </div>

            {/* MAP SECTION */}
            <div className="flex-1 relative">
                <MapContainer
                    center={[23.3441, 85.3096]}
                    zoom={16}
                    className="w-full h-full z-0"
                    zoomControl={false}
                    attributionControl={false}
                >
                    <>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        {routePoints.length > 1 && (
                            <Polyline positions={routePoints} pathOptions={{ color: '#22c55e', weight: 5, smoothFactor: 1 }} />
                        )}
                        {routePoints.length > 0 && (
                            <CircleMarker 
                                center={routePoints[routePoints.length - 1]} 
                                pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }} 
                                radius={8} 
                            />
                        )}
                        <MapAutoCenter routePoints={routePoints} setMapInstance={setMapInstance} />
                    </>
                </MapContainer>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-[2000] p-6">
                        <div className="bg-black/80 rounded-2xl p-6 text-center shadow-lg w-full max-w-sm">
                            <div className="text-4xl mb-3">⚠️</div>
                            <div className="text-white font-semibold mb-2">{error}</div>
                            <div className="text-sm text-gray-400 mb-4">Make sure location is enabled in your browser settings</div>
                            <button
                                className="bg-[#ff5733] text-white rounded-xl px-6 py-2"
                                onClick={() => {
                                    reset();
                                    start(activityMode === 'run' ? 'running' : 'walking');
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM STATS PANEL */}
            <div className="bg-[#111] rounded-t-3xl px-5 pt-4 pb-8 z-10 -mt-6">
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center flex flex-col justify-center h-24">
                        <span className="text-xl font-extrabold text-[#4ade80]">{totalDistance.toFixed(2)} km</span>
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">DISTANCE</span>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center flex flex-col justify-center h-24">
                        <span className="text-xl font-extrabold text-[#60a5fa]">{formatTime(seconds)}</span>
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">DURATION</span>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-2xl p-3 text-center flex flex-col justify-center h-24">
                        <span className="text-xl font-extrabold text-[#ff5733]">{caloriesBurned} kcal</span>
                        <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">BURNED</span>
                    </div>
                </div>

                <div className="text-center mb-4 text-sm text-gray-400">
                    Pace: {currentPace} min/km
                </div>

                {!isTracking && !isPaused && (
                    <button
                        className="w-full py-5 bg-[#22c55e] text-black font-extrabold text-lg rounded-2xl tracking-wide"
                        onClick={() => start(activityMode === 'run' ? 'running' : 'walking')}
                    >
                        ▶ START
                    </button>
                )}

                {isTracking && (
                    <button
                        className="w-full py-5 bg-[#eab308] text-black font-extrabold text-lg rounded-2xl tracking-wide"
                        onClick={pause}
                    >
                        ⏸ PAUSE
                    </button>
                )}

                {isPaused && (
                    <div className="flex gap-3">
                        <button
                            className="flex-1 py-5 bg-[#22c55e] text-black font-extrabold text-base rounded-2xl"
                            onClick={resume}
                        >
                            ▶ RESUME
                        </button>
                        <button
                            className="flex-1 py-5 bg-[#ef4444] text-white font-extrabold text-base rounded-2xl"
                            onClick={handleStop}
                        >
                            ⏹ STOP
                        </button>
                    </div>
                )}
            </div>

            {/* SESSION SUMMARY MODAL */}
            {showSummary && sessionData && (
                <div className="fixed inset-0 bg-black/85 z-[3000] flex items-center justify-center px-5">
                    <div className="bg-[#141414] rounded-3xl p-6 w-full max-w-sm">
                        <h2 className="text-2xl font-extrabold text-white text-center mb-5">🎉 Session Complete!</h2>
                        
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-[#1e1e1e] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-extrabold text-[#ff5733]">{sessionData.distance} km</div>
                                <div className="text-xs text-gray-500 mt-1">Distance</div>
                            </div>
                            <div className="bg-[#1e1e1e] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-extrabold text-[#ff5733]">{formatTime(sessionData.duration)}</div>
                                <div className="text-xs text-gray-500 mt-1">Duration</div>
                            </div>
                            <div className="bg-[#1e1e1e] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-extrabold text-[#ff5733]">{sessionData.pace} /km</div>
                                <div className="text-xs text-gray-500 mt-1">Avg Pace</div>
                            </div>
                            <div className="bg-[#1e1e1e] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-extrabold text-[#ff5733]">{sessionData.caloriesBurned} kcal</div>
                                <div className="text-xs text-gray-500 mt-1">Burned</div>
                            </div>
                        </div>

                        <div className="text-center mb-5">
                            <span className="inline-block bg-[#1a2f5a] text-[#60a5fa] text-sm font-semibold px-4 py-1 rounded-full">
                                {activityMode === 'run' ? "🏃 Running" : "🚶 Walking"}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 py-3 bg-[#222] text-gray-400 font-semibold rounded-xl"
                                onClick={() => {
                                    if (window.confirm('Discard this session? Data will be lost.')) {
                                        reset();
                                        setShowSummary(false);
                                        setCurrentView('workout');
                                    }
                                }}
                            >
                                Discard
                            </button>
                            <button
                                className="flex-[2] py-3 bg-[#ff5733] text-white font-bold rounded-xl px-5 flex items-center justify-center gap-2"
                                onClick={handleSaveSession}
                                disabled={isSaving}
                            >
                                {isSaving ? <><Loader2 className="animate-spin w-4 h-4" /> Saving...</> : 'Save Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutTrackingPage;
