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

            let sum = 0;
            snapshot.docs.forEach(d => {
                const data = d.data();
                const docTime = data.date?.toMillis ? data.date.toMillis() : 0;
                
                if (docTime >= startTime && docTime <= endTime) {
                    sum += Number(data.caloriesBurned || 0);
                }
            });

            setTotalBurned(Math.round(sum));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [targetDate]);

    return { totalBurned, loading };
}
