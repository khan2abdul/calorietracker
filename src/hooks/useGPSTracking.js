import { useState, useRef, useEffect } from 'react';
import { db, auth } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) *
            Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calcCalories(dist, dur, type, weight) {
  const w = isNaN(weight) || !weight ? 70 : Number(weight);
  let cal = 0;
  if (type === 'running')  cal = dist * w * 1.1;
  else if (type === 'walking')  cal = dist * w * 0.9;
  else cal = dist > 0 ? dist * w * 0.9 : (dur/60) * w * 0.06;
  
  return isNaN(cal) ? 0 : Math.round(cal);
}

function calcPace(seconds, distKm) {
  if (!distKm || isNaN(distKm) || distKm < 0.05) return '--';
  const paceMin = (seconds / 60) / distKm;
  const min = Math.floor(paceMin);
  const sec = Math.round((paceMin - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function useGPSTracking() {
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [routePoints, setRoutePoints] = useState([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState(null);
    const [userWeight, setUserWeight] = useState(70);
    const [activityType, setActivityType] = useState('walking');

    const watchIdRef = useRef(null);
    const timerRef = useRef(null);
    const wakeLockRef = useRef(null);
    const lastPointRef = useRef(null);

    useEffect(() => {
        const fetchWeight = async () => {
            if (!auth.currentUser) return;
            try {
                const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (d.exists()) {
                     const w = d.data().weight || d.data().userStats?.weight;
                     if (w) setUserWeight(Number(w));
                }
            } catch (e) { /* fallback stays 70 */ }
        };
        fetchWeight();
    }, []);

    const start = async (type) => {
        setError(null);
        setActivityType(type);
        if (!navigator.geolocation) {
            setError('GPS not available on this device.');
            return;
        }

        try {
            if (navigator.wakeLock) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (e) { /* fail silently */ }

        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                if (accuracy > 30) return;
                
                const newPoint = { lat: latitude, lng: longitude };
                if (lastPointRef.current) {
                    const dist = haversine(
                        lastPointRef.current.lat, lastPointRef.current.lng,
                        latitude, longitude
                    );
                    if (dist < 0.003) return; // less than 3 meters
                    setTotalDistance(prev => prev + dist);
                }
                lastPointRef.current = newPoint;
                setRoutePoints(prev => [...prev, newPoint]);
            },
            (err) => {
                if (err.code === 1) setError('Location permission denied. Please enable GPS in your browser settings.');
                else if (err.code === 2) setError('GPS signal not found. Try moving to an open area.');
                else setError('GPS error. Please try again.');
                pause();
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
        );
        
        setIsTracking(true);
        setIsPaused(false);
    };

    const pause = async () => {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        try { await wakeLockRef.current?.release(); } catch(e){}
        setIsTracking(false);
        setIsPaused(true);
    };

    const resume = () => {
        start(activityType);
    };

    const stop = () => {
        pause();
        return {
            activityType,
            duration: seconds,
            distance: parseFloat(totalDistance.toFixed(2)),
            caloriesBurned: calcCalories(totalDistance, seconds, activityType, userWeight),
            route: routePoints,
            pace: calcPace(seconds, totalDistance)
        };
    };

    const reset = () => {
        pause();
        setRoutePoints([]);
        setTotalDistance(0);
        setSeconds(0);
        setError(null);
        lastPointRef.current = null;
    };

    useEffect(() => {
        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            try { wakeLockRef.current?.release(); } catch(e){}
        };
    }, []);

    return {
        isTracking,
        isPaused,
        routePoints,
        totalDistance,
        seconds,
        currentPace: calcPace(seconds, totalDistance),
        caloriesBurned: calcCalories(totalDistance, seconds, activityType, userWeight),
        error,
        start,
        pause,
        resume,
        stop,
        reset
    };
}
