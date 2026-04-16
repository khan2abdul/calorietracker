import { useState, useRef, useEffect, useCallback } from 'react';
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
    const [steps, setSteps] = useState(0);
    const [error, setError] = useState(null);
    const [userWeight, setUserWeight] = useState(70);
    const [activityType, setActivityType] = useState('walking');

    const watchIdRef = useRef(null);
    const wakeLockRef = useRef(null);
    const lastPointRef = useRef(null);

    // Use refs for values that need to survive background throttling
    const stepsRef = useRef(0);
    const distanceRef = useRef(0);
    const routeRef = useRef([]);
    const motionHandlerRef = useRef(null);
    const isTrackingRef = useRef(false);
    const isPausedRef = useRef(false);

    // Timestamp-based timer refs (survives background throttling)
    const timerStartRef = useRef(null);      // When tracking first started
    const pausedElapsedRef = useRef(0);      // Accumulated seconds before last pause
    const timerRafRef = useRef(null);        // requestAnimationFrame / setTimeout id
    const timerIntervalRef = useRef(null);   // Fallback interval

    // Step counter refs
    const lastStepTimeRef = useRef(0);

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

    // --- TIMESTAMP-BASED TIMER ---
    // Instead of setInterval (which gets throttled in background), we compute
    // elapsed time from Date.now() so even if updates pause, the time is correct
    // when the page comes back.
    const updateTimer = useCallback(() => {
        if (!timerStartRef.current || isPausedRef.current) return;
        const now = Date.now();
        const activeSeconds = Math.floor((now - timerStartRef.current) / 1000);
        const totalSeconds = pausedElapsedRef.current + activeSeconds;
        setSeconds(totalSeconds);
    }, []);

    const startTimer = useCallback(() => {
        timerStartRef.current = Date.now();

        // Primary: 1-second interval (visible tab)
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(updateTimer, 1000);
    }, [updateTimer]);

    const stopTimer = useCallback(() => {
        // Freeze the elapsed time
        if (timerStartRef.current) {
            const now = Date.now();
            const activeSeconds = Math.floor((now - timerStartRef.current) / 1000);
            pausedElapsedRef.current += activeSeconds;
            setSeconds(pausedElapsedRef.current);
        }
        timerStartRef.current = null;
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, []);

    // --- WAKE LOCK MANAGEMENT ---
    const acquireWakeLock = useCallback(async () => {
        try {
            if (navigator.wakeLock) {
                // Release old one first if exists
                try { await wakeLockRef.current?.release(); } catch(e) {}
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                wakeLockRef.current.addEventListener('release', () => {
                    console.log('[GPS] Wake lock released');
                });
                console.log('[GPS] Wake lock acquired');
            }
        } catch (e) {
            console.warn('[GPS] Wake lock failed:', e.message);
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        try { await wakeLockRef.current?.release(); } catch(e) {}
        wakeLockRef.current = null;
    }, []);

    // --- VISIBILITY CHANGE HANDLER ---
    // Re-acquire wake lock and recalculate time when user comes back to app
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Page came back to foreground
                if (isTrackingRef.current && !isPausedRef.current) {
                    // Re-acquire wake lock (it gets released when screen turns off)
                    acquireWakeLock();

                    // Force-update the timer immediately (catch up missed ticks)
                    updateTimer();

                    // Sync steps from ref to state (motion events may have fired)
                    setSteps(stepsRef.current);

                    // Sync distance from ref to state
                    setTotalDistance(distanceRef.current);
                    setRoutePoints([...routeRef.current]);

                    console.log('[GPS] Resumed from background — synced state');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [acquireWakeLock, updateTimer]);

    // Motion Permission Handler
    const requestMotionPermission = async () => {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                return permission === 'granted';
            } catch (e) {
                console.error("Motion permission error:", e);
                return false;
            }
        }
        return true; // Likely Android or desktop
    };

    // --- STEP DETECTION ---
    // Stored in a ref and synced to state on a schedule so it's always fresh
    const attachMotionListener = useCallback(() => {
        // Remove old listener first if it exists
        if (motionHandlerRef.current) {
            window.removeEventListener('devicemotion', motionHandlerRef.current);
            motionHandlerRef.current = null;
        }

        const handleMotion = (event) => {
            const accel = event.accelerationIncludingGravity;
            if (!accel) return;

            const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
            const now = Date.now();

            // Threshold for a step; min 350ms between steps to avoid double counting
            if (magnitude > 13.5 && (now - lastStepTimeRef.current) > 350) {
                stepsRef.current += 1;
                lastStepTimeRef.current = now;
                // Update state directly for real-time display
                setSteps(stepsRef.current);
            }
        };

        motionHandlerRef.current = handleMotion;
        window.addEventListener('devicemotion', handleMotion);
    }, []);

    const detachMotionListener = useCallback(() => {
        if (motionHandlerRef.current) {
            window.removeEventListener('devicemotion', motionHandlerRef.current);
            motionHandlerRef.current = null;
        }
    }, []);

    // --- GPS POSITION HANDLER ---
    const startGPSWatch = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                if (accuracy > 30) return; // Skip inaccurate readings

                const newPoint = { lat: latitude, lng: longitude };

                if (lastPointRef.current) {
                    const dist = haversine(
                        lastPointRef.current.lat, lastPointRef.current.lng,
                        latitude, longitude
                    );
                    if (dist < 0.003) return; // Less than 3 meters — likely noise
                    distanceRef.current += dist;
                    setTotalDistance(distanceRef.current);
                }

                lastPointRef.current = newPoint;
                routeRef.current = [...routeRef.current, newPoint];
                setRoutePoints([...routeRef.current]);
            },
            (err) => {
                if (err.code === 1) setError('Location permission denied.');
                else if (err.code === 2) setError('GPS signal not found.');
                else setError('GPS error.');
                internalPause();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 2000,     // Accept positions up to 2s old (was 3s)
                timeout: 30000,       // Wait longer before timeout (was 15s)
                distanceFilter: 3     // Android hint: only fire for 3m+ movement
            }
        );
    }, []);

    const stopGPSWatch = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    // --- MAIN CONTROLS ---
    const start = async (type) => {
        setError(null);
        setActivityType(type);

        const motionGranted = await requestMotionPermission();
        if (!motionGranted) {
            console.warn("Motion permission denied. Falling back to GPS estimation for steps.");
        }

        if (!navigator.geolocation) {
            setError('GPS not available on this device.');
            return;
        }

        // Acquire wake lock to prevent screen sleep
        await acquireWakeLock();

        // Start timestamp-based timer
        startTimer();

        // Start GPS watch
        startGPSWatch();

        // Attach accelerometer for step counting
        attachMotionListener();

        isTrackingRef.current = true;
        isPausedRef.current = false;
        setIsTracking(true);
        setIsPaused(false);
    };

    // Internal pause that doesn't trigger duplicate state issues
    const internalPause = useCallback(async () => {
        stopGPSWatch();
        stopTimer();
        detachMotionListener();
        await releaseWakeLock();

        isTrackingRef.current = false;
        isPausedRef.current = true;
        setIsTracking(false);
        setIsPaused(true);

        // Sync final values from refs to state
        setSteps(stepsRef.current);
        setTotalDistance(distanceRef.current);
        setRoutePoints([...routeRef.current]);
    }, [stopGPSWatch, stopTimer, detachMotionListener, releaseWakeLock]);

    const pause = async () => {
        await internalPause();
    };

    const resume = async () => {
        // Don't reset steps/distance/route — just restart tracking
        setError(null);

        await acquireWakeLock();
        startTimer();
        startGPSWatch();
        attachMotionListener();

        isTrackingRef.current = true;
        isPausedRef.current = false;
        setIsTracking(true);
        setIsPaused(false);
    };

    const stop = () => {
        // Pause everything first
        stopGPSWatch();
        stopTimer();
        detachMotionListener();
        releaseWakeLock();

        isTrackingRef.current = false;
        isPausedRef.current = false;
        setIsTracking(false);
        setIsPaused(false);

        // Final sync
        const finalSteps = stepsRef.current;
        const finalDistance = distanceRef.current;
        const finalSeconds = pausedElapsedRef.current + (
            timerStartRef.current
                ? Math.floor((Date.now() - timerStartRef.current) / 1000)
                : 0
        );

        // Hybrid step calculation:
        // Use sensor steps, but fall back to GPS estimate if sensors didn't work
        const gpsEstimatedSteps = Math.round(finalDistance * 1350);
        const resultSteps = finalSteps > (gpsEstimatedSteps * 0.5) ? finalSteps : gpsEstimatedSteps;

        return {
            activityType,
            duration: finalSeconds,
            distance: parseFloat(finalDistance.toFixed(2)),
            caloriesBurned: calcCalories(finalDistance, finalSeconds, activityType, userWeight),
            route: routeRef.current,
            pace: calcPace(finalSeconds, finalDistance),
            steps: resultSteps || gpsEstimatedSteps
        };
    };

    const reset = () => {
        stopGPSWatch();
        stopTimer();
        detachMotionListener();
        releaseWakeLock();

        isTrackingRef.current = false;
        isPausedRef.current = false;

        // Reset all refs
        stepsRef.current = 0;
        distanceRef.current = 0;
        routeRef.current = [];
        lastPointRef.current = null;
        lastStepTimeRef.current = 0;
        timerStartRef.current = null;
        pausedElapsedRef.current = 0;

        // Reset all state
        setRoutePoints([]);
        setTotalDistance(0);
        setSeconds(0);
        setSteps(0);
        setError(null);
        setIsTracking(false);
        setIsPaused(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopGPSWatch();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            detachMotionListener();
            releaseWakeLock();
        };
    }, [stopGPSWatch, detachMotionListener, releaseWakeLock]);

    // Live display values
    const gpsEstimatedSteps = Math.round(totalDistance * 1350);
    const displaySteps = steps > 0 ? steps : gpsEstimatedSteps;

    return {
        isTracking,
        isPaused,
        routePoints,
        totalDistance,
        seconds,
        steps: displaySteps,
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
