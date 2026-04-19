import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, startAfter, onSnapshot, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export const activityEmoji = {
    walking: '🚶',
    running: '🏃',
    skipping: '⏭️',
    cycling: '🚴',
    gym: '🏋️',
    hiit: '🔥',
    cardio: '❤️‍🔥',
    exercise: '💪',
    other: '⚡'
};

export function formatSessionDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function useWorkoutHistory() {
    const [allSessions, setAllSessions] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    const [hasMore, setHasMore] = useState(false);
    
    const [weeklyStats, setWeeklyStats] = useState({ sessions: 0, km: 0, kcal: 0 });
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;

        // Fetch all user activities (bypasses composite index requirements & SDK crashes)
        const qAll = query(
            collection(db, 'activities'),
            where('userId', '==', uid)
        );

        const unsubscribe = onSnapshot(qAll, (snapshot) => {
            let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort historically (descending date)
            docs.sort((a, b) => {
                const timeA = a.date?.toMillis ? a.date.toMillis() : 0;
                const timeB = b.date?.toMillis ? b.date.toMillis() : 0;
                return timeB - timeA;
            });

            setAllSessions(docs);
            setLoading(false);

            // Compute Weekly Stats locally
            const now = new Date();
            const dayOfWeek = now.getDay();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - dayOfWeek);
            weekStart.setHours(0, 0, 0, 0);
            const weekStartTime = weekStart.getTime();

            let tSessions = 0, tKm = 0, tKcal = 0;
            docs.forEach(d => {
                const docTime = d.date?.toMillis ? d.date.toMillis() : 0;
                if (docTime >= weekStartTime) {
                    tSessions++;
                    if (d.distance) tKm += Number(d.distance);
                    if (d.caloriesBurned) tKcal += Number(d.caloriesBurned);
                }
            });

            setWeeklyStats({
                sessions: tSessions,
                km: tKm.toFixed(1),
                kcal: tKcal
            });
            setWeeklyLoading(false);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    // Update paginated view when visibleCount or allSessions changes
    useEffect(() => {
        setSessions(allSessions.slice(0, visibleCount));
        setHasMore(allSessions.length > visibleCount);
    }, [allSessions, visibleCount]);

    const loadMore = async () => {
        // Simple local pagination bypasses the need for startAfter() cursor math
        setVisibleCount(prev => prev + 10);
    };

    const deleteSession = async (docId) => {
        try {
            await deleteDoc(doc(db, 'activities', docId));
            // Success
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    return {
        sessions,
        loading,
        loadingMore: false,
        hasMore,
        loadMore,
        deleteSession,
        weeklyStats,
        weeklyLoading
    };
}
