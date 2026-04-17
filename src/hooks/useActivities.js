import { collection, addDoc, doc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook or utility functions for managing activities/exercises.
 */
export function useActivities(user, currentDate) {
    const addActivity = async (item) => {
        if (!user) return;
        
        const activityPayload = {
            userId: user.uid,
            date: Timestamp.fromDate(currentDate),
            type: 'manual',
            activityType: item.activityType || item.name || 'other',
            duration: parseInt(item.duration) || 30,
            caloriesBurned: item.calories,
            steps: item.steps || 0,
            notes: `Added via AI: ${item.name}`,
            createdAt: serverTimestamp()
        };

        return await addDoc(collection(db, 'activities'), activityPayload);
    };

    const deleteActivity = async (activityId) => {
        if (!user || !activityId) return;
        try {
            const actDoc = doc(db, 'activities', activityId);
            await deleteDoc(actDoc);
        } catch (e) {
            console.error("Failed to delete activity:", e);
        }
    };

    return { addActivity, deleteActivity };
}
