import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export function useTodayBurned(targetDate = new Date()) {
    const [totalBurned, setTotalBurned] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;
        
        // Single field query bypasses composite index requirement
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

            console.log("Activity Snapshot received. Total docs:", snapshot.docs.length);
            console.log("Date Range:", new Date(startTime).toLocaleString(), "TO", new Date(endTime).toLocaleString());

            let sum = 0;
            snapshot.docs.forEach(d => {
                const data = d.data();
                const docTime = data.date?.toMillis ? data.date.toMillis() : 0;
                
                if (docTime >= startTime && docTime <= endTime) {
                    console.log("Activity match found:", data.activityType, data.caloriesBurned, "kcal");
                    sum += Number(data.caloriesBurned || 0);
                } else {
                    console.log("Activity filtered out (wrong day):", new Date(docTime).toLocaleString());
                }
            });

            console.log("Final Sum for", targetDate, "is", sum);
            setTotalBurned(Math.round(sum));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [targetDate, auth.currentUser]);

    return { totalBurned, loading };
}
