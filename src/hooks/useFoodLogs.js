import { useState, useEffect, useMemo, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getLocalDateStr } from '../utils';

/**
 * Custom hook to manage daily food logs and water intake.
 * Separates core tracking logic from the UI components.
 */
export function useFoodLogs(user, currentDate) {
    const [logs, setLogs] = useState({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
    const [waterIntake, setWaterIntake] = useState(0);
    const lastUpdateRef = useRef(0);

    // 1. Fetch data from Firestore
    useEffect(() => {
        if (!user) return;
        const dateStr = getLocalDateStr(currentDate);
        const logDoc = doc(db, 'users', user.uid, 'daily_logs', dateStr);
        
        const unsub = onSnapshot(logDoc, (snap) => {
            console.log("Firestore Snapshot received for:", dateStr, "Exists:", snap.exists());
            if (snap.exists()) {
                const data = snap.data();
                
                // Firestore latency compensation: ignore snapshots that are older than our last local update
                const serverTime = data.updatedAt?.toMillis?.() || 0;
                if (lastUpdateRef.current && serverTime > 0 && serverTime < lastUpdateRef.current) {
                    console.log("Ignoring old snapshot (Server:", serverTime, "Local:", lastUpdateRef.current, ")");
                    return;
                }

                const freshLogs = { 
                    Breakfast: [], Lunch: [], Dinner: [], Snacks: [], 
                    ...(data.foodLogs || {}) 
                };
                setLogs(freshLogs);
                setWaterIntake(data.waterIntake || 0);
            } else {
                console.log("No daily log document found, clearing state.");
                setLogs({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
                setWaterIntake(0);
            }
        });
        return unsub;
    }, [user, currentDate]);

    // Cleanup logs on logout
    useEffect(() => {
        if (!user) {
            setLogs({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] });
            setWaterIntake(0);
        }
    }, [user]);

    // 2. Derive totals
    const totals = useMemo(() => {
        const allFoods = Object.values(logs).flat();
        return allFoods.reduce((acc, f) => ({
            cals: acc.cals + (f.calories || 0),
            pro: acc.pro + (f.protein || 0),
            carb: acc.carb + (f.carbs || 0),
            fat: acc.fat + (f.fat || 0)
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });
    }, [logs]);

    // 3. Actions
    const addFoodItem = async (item, mealType, editingFood = null) => {
        if (!user) return;
        const dateStr = getLocalDateStr(currentDate);
        const newLogs = { ...logs };
        
        const entryId = editingFood?.uid || Math.random().toString(36).substr(2, 9);
        const newEntry = { 
            ...item, 
            uid: entryId, 
            meal: mealType, 
            timestamp: new Date().toISOString() 
        };

        if (editingFood) {
            const oldMeal = editingFood.meal || mealType;
            newLogs[oldMeal] = (newLogs[oldMeal] || []).filter(f => f.uid !== editingFood.uid);
        }
        newLogs[mealType] = [...(newLogs[mealType] || []), newEntry];

        const allFoods = Object.values(newLogs).flat();
        const newTotals = allFoods.reduce((acc, f) => ({
            cals: acc.cals + (f.calories || 0),
            pro: acc.pro + (f.protein || 0),
            carb: acc.carb + (f.carbs || 0),
            fat: acc.fat + (f.fat || 0)
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });

        // Optimistic update
        setLogs(newLogs);

        const logDocRef = doc(db, 'users', user.uid, 'daily_logs', dateStr);
        
        console.log(`Saving meal to Firestore: users/${user.uid}/daily_logs/${dateStr}`);
        console.log("Meal Content:", item.name, "to", mealType);

        await setDoc(logDocRef, { 
            foodLogs: newLogs,
            totals: newTotals,
            updatedAt: serverTimestamp()
        }, { merge: true });

        lastUpdateRef.current = Date.now();
        console.log("Save successful.");
    };

    const deleteFoodItem = async (food) => {
        if (!user) return;
        const dateStr = getLocalDateStr(currentDate);
        const newLogs = { ...logs };
        let found = false;
        let totalRemaining = 0;
        
        // Robust deletion: Search all meal categories
        Object.keys(newLogs).forEach(mealKey => {
            if (Array.isArray(newLogs[mealKey])) {
                const countBefore = newLogs[mealKey].length;
                newLogs[mealKey] = newLogs[mealKey].filter(f => {
                    const match = (food.uid && (String(f.uid) === String(food.uid) || String(f.id) === String(food.uid))) || 
                                  (food.id && (String(f.uid) === String(food.id) || String(f.id) === String(food.id)));
                    if (match) found = true;
                    return !match;
                });
                totalRemaining += newLogs[mealKey].length;
            }
        });

        if (!found) {
            alert(`Could not find item "${food.name}" to delete in the local logs. Please refresh.`);
            console.error("Item not found in logs:", food);
            return;
        }

        const allFoods = Object.values(newLogs).flat();
        const newTotals = allFoods.reduce((acc, f) => ({
            cals: acc.cals + (f.calories || 0),
            pro: acc.pro + (f.protein || 0),
            carb: acc.carb + (f.carbs || 0),
            fat: acc.fat + (f.fat || 0)
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });

        // Optimistic update
        setLogs({ ...newLogs });

        try {
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), { 
                foodLogs: newLogs,
                totals: newTotals,
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log("Firestore delete success");
        } catch (e) {
            console.error("Delete failed:", e);
            alert("Delete failed on server: " + e.message);
        }
    };

    const deleteBatch = async (meal, selectedIds) => {
        if (!user || selectedIds.size === 0) return;
        const dateStr = getLocalDateStr(currentDate);
        const newLogs = { ...logs };
        
        // Remove selected IDs from the targeted meal
        if (newLogs[meal]) {
            newLogs[meal] = newLogs[meal].filter(f => !selectedIds.has(f.uid));
        }
        
        const allFoods = Object.values(newLogs).flat();
        const newTotals = allFoods.reduce((acc, f) => ({
            cals: acc.cals + (f.calories || 0),
            pro: acc.pro + (f.protein || 0),
            carb: acc.carb + (f.carbs || 0),
            fat: acc.fat + (f.fat || 0)
        }), { cals: 0, pro: 0, carb: 0, fat: 0 });

        // Optimistic update
        setLogs(newLogs);

        try {
            await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), { 
                foodLogs: newLogs,
                totals: newTotals,
                updatedAt: serverTimestamp() 
            }, { merge: true });
        } catch (e) {
            console.error("Batch delete failed:", e);
            alert("Batch delete failed: " + e.message);
        }
    };

    const updateWater = async (change) => {
        if (!user) return;
        const dateStr = getLocalDateStr(currentDate);
        const newValue = Math.max(0, waterIntake + change);
        
        // Optimistic update
        setWaterIntake(newValue);

        await setDoc(doc(db, 'users', user.uid, 'daily_logs', dateStr), { 
            waterIntake: newValue,
            updatedAt: serverTimestamp() 
        }, { merge: true });
    };

    const updateDayTotals = async (date, data) => {
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid, 'daily_logs', date), {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    return {
        logs,
        totals,
        waterIntake,
        addFoodItem,
        deleteFoodItem,
        deleteBatch,
        updateWater,
        updateDayTotals
    };
}
