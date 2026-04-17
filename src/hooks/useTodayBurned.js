import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export function useTodayBurned(targetDate = new Date()) {
    const [totalBurned, setTotalBurned] = useState(0);
    const [metrics, setMetrics] = useState({ workoutBurned: 0, stepBurned: 0, workoutMinutes: 0, steps: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        const qAll = query(
            collection(db, 'activities'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(qAll, (snapshot) => {
            const start = new Date(targetDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(targetDate);
            end.setHours(23, 59, 59, 999);
            const startTime = start.getTime();
            const endTime = end.getTime();

            let total = 0, workoutB = 0, stepB = 0, workoutM = 0, totalSteps = 0;

            snapshot.docs.forEach(d => {
                const data = d.data();
                const docTime = data.date?.toMillis ? data.date.toMillis() : 0;
                
                if (docTime >= startTime && docTime <= endTime) {
                    const cals = Number(data.caloriesBurned || 0);
                    total += cals;
                    
                    if (data.type === 'gps' || data.activityType === 'gym') {
                        workoutB += cals;
                        workoutM += Number(data.duration || 0);
                    } else {
                        stepB += cals;
                    }
                    totalSteps += Number(data.steps || 0);
                }
            });

            setTotalBurned(Math.round(total));
            setMetrics({ 
                workoutBurned: workoutB, 
                stepBurned: stepB, 
                workoutMinutes: workoutM, 
                steps: totalSteps 
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [targetDate, auth.currentUser]);

    return { 
        totalBurned, 
        workoutBurned: Math.round(metrics.workoutBurned), 
        stepBurned: Math.round(metrics.stepBurned), 
        workoutMinutes: metrics.workoutMinutes, 
        steps: metrics.steps,
        loading 
    };
}
