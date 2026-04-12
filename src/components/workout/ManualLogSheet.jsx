import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, addDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
console.log("ManualLogSheet-v3: Firestore functions imported:", { addDoc: !!addDoc, setDoc: !!setDoc });
import { X, Loader2 } from 'lucide-react';

const ManualLogSheet = ({ isOpen, onClose, editActivity = null }) => {
    const [userWeight, setUserWeight] = useState(70);
    const [selectedActivity, setSelectedActivity] = useState('walking');
    const [duration, setDuration] = useState('');
    const [distance, setDistance] = useState('');
    const [notes, setNotes] = useState('');
    
    const [durationError, setDurationError] = useState('');
    const [distanceError, setDistanceError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [toast, setToast] = useState(null);

    // Populate fields when editing
    useEffect(() => {
        if (editActivity) {
            setSelectedActivity(editActivity.activityType || 'walking');
            setDuration(editActivity.duration.toString());
            setDistance(editActivity.distance ? editActivity.distance.toString() : '');
            setNotes(editActivity.notes || '');
        } else {
            // Reset for new entry
            setSelectedActivity('walking');
            setDuration('');
            setDistance('');
            setNotes('');
        }
    }, [editActivity, isOpen]);

    useEffect(() => {
        const fetchWeight = async () => {
            if (!auth.currentUser) return;
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                     const w = snap.data().weight || snap.data().userStats?.weight;
                     if (w) setUserWeight(Number(w));
                }
            } catch (error) {
                console.error('Error fetching weight:', error);
            }
        };
        if (isOpen) {
            fetchWeight();
        }
    }, [isOpen]);

    const handleActivityChange = (activity) => {
        setSelectedActivity(activity);
        if (activity === 'skipping' || activity === 'gym') {
            setDistance('');
            setDistanceError('');
        }
    };

    const calculatedBurn = useMemo(() => {
        const w = userWeight;
        const dist = parseFloat(distance) || 0;
        const dur = parseFloat(duration) || 0;
        let burn = 0;

        if (selectedActivity === "walking") {
            burn = dist > 0 ? dist * w * 0.9 : dur * w * 0.05;
        } else if (selectedActivity === "running") {
            burn = dist > 0 ? dist * w * 1.1 : dur * w * 0.10;
        } else if (selectedActivity === "skipping") {
            burn = dur * w * 0.12;
        } else if (selectedActivity === "cycling") {
            burn = dist > 0 ? dist * w * 0.5 : dur * w * 0.06;
        } else if (selectedActivity === "gym") {
            burn = dur * w * 0.08;
        } else {
            burn = dur * w * 0.06;
        }
        return Math.round(burn);
    }, [userWeight, distance, duration, selectedActivity]);

    const handleSave = async () => {
        setDurationError('');
        setDistanceError('');
        
        let hasError = false;
        const dur = parseFloat(duration);
        const dist = parseFloat(distance);

        if (!duration || dur <= 0) {
            setDurationError('Duration is required');
            hasError = true;
        } else if (dur > 300) {
            setDurationError('Maximum 5 hours allowed');
            hasError = true;
        }

        if (distance && dist <= 0) {
            setDistanceError('Distance must be positive');
            hasError = true;
        }

        if (hasError) return;

        setIsSaving(true);
        try {
            if (!auth.currentUser) throw new Error("Not authenticated");

            const activityData = {
                userId: auth.currentUser.uid,
                activityType: selectedActivity,
                duration: parseInt(dur),
                distance: dist || 0,
                caloriesBurned: calculatedBurn,
                notes: notes.trim(),
                updatedAt: serverTimestamp()
            };

            if (editActivity && editActivity.id) {
                // UPDATE
                const activityRef = doc(db, 'activities', editActivity.id);
                await setDoc(activityRef, activityData, { merge: true });
                setToast({ message: 'Activity updated! 💪', type: 'success' });
            } else {
                // CREATE
                await addDoc(collection(db, 'activities'), {
                    ...activityData,
                    date: Timestamp.now(),
                    type: "manual",
                    route: [],
                    createdAt: serverTimestamp()
                });
                setToast({ message: 'Activity saved! 💪', type: 'success' });
            }
            
            // Reset fields
            setSelectedActivity('walking');
            setDuration('');
            setDistance('');
            setNotes('');
            setTimeout(() => { setToast(null); onClose(); }, 1500);

        } catch (error) {
            console.error('Error saving:', error);
            setToast({ message: 'Failed to save. Please try again.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };



    const showDistanceField = selectedActivity !== 'skipping' && selectedActivity !== 'gym';

    const activities = [
        { id: 'walking', label: 'Walking', icon: '🚶' },
        { id: 'running', label: 'Running', icon: '🏃' },
        { id: 'skipping', label: 'Skipping', icon: '⏭️' },
        { id: 'cycling', label: 'Cycling', icon: '🚴' },
        { id: 'gym', label: 'Gym', icon: '🏋️' },
        { id: 'other', label: 'Other', icon: '⚡' }
    ];

    return (
        <>
            <div className={`fixed inset-0 bg-black/70 z-[80] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed bottom-0 left-0 right-0 z-[90] bg-[#141414] rounded-t-3xl p-4 pb-8 max-h-[92vh] overflow-y-auto transform transition-transform duration-300 ease-out md:max-w-md md:left-1/2 md:-translate-x-1/2 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                
                {/* Handle bar */}
                <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5"></div>

                {/* Header row */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">{editActivity ? 'Edit Activity' : 'Log Activity'}</h2>
                    <button onClick={onClose} className="bg-[#222] rounded-full w-7 h-7 flex items-center justify-center">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>

                {/* ACTIVITY TYPE CHIPS */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {activities.map((act) => (
                        <div 
                            key={act.id} 
                            onClick={() => handleActivityChange(act.id)}
                            className={
                                selectedActivity === act.id 
                                ? "bg-[#1a2f5a] border border-[#3b82f6] text-[#60a5fa] rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                                : "bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 rounded-full px-3 py-1.5 text-xs cursor-pointer transition-colors"
                            }
                        >
                            {act.icon} {act.label}
                        </div>
                    ))}
                </div>

                {/* FORM FIELDS */}
                <div className="mb-3">
                    <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
                    <input 
                        type="number" 
                        inputMode="numeric" 
                        placeholder="e.g. 30"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className={`w-full bg-[#1e1e1e] border ${durationError ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#3b82f6] transition-colors`}
                    />
                    {durationError && <p className="text-[10px] text-red-400 mt-1">{durationError}</p>}
                </div>

                {showDistanceField && (
                    <div className="mb-3">
                        <label className="text-xs text-gray-400 mb-1 block">Distance (km)</label>
                        <input 
                            type="number" 
                            inputMode="decimal" 
                            step="0.1" 
                            placeholder="e.g. 3.5"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className={`w-full bg-[#1e1e1e] border ${distanceError ? 'border-red-500' : 'border-[#2a2a2a]'} rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#3b82f6] transition-colors`}
                        />
                        {distanceError && <p className="text-[10px] text-red-400 mt-1">{distanceError}</p>}
                    </div>
                )}

                <div className="mb-3">
                    <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
                    <input 
                        type="text" 
                        placeholder="Morning walk..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#3b82f6] transition-colors"
                    />
                </div>

                {/* LIVE CALORIE BURN PREVIEW */}
                <div className="bg-[#1a1000] border border-[#ff5733] rounded-xl p-3 text-center mb-4">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">🔥 Estimated Burn</div>
                    <div className="text-2xl font-extrabold text-[#ff5733]">{calculatedBurn} kcal</div>
                </div>

                {/* SAVE BUTTON */}
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${isSaving ? 'bg-[#cc4422] text-white opacity-70 cursor-not-allowed flex items-center justify-center gap-2' : 'bg-[#ff5733] text-white'}`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin text-white w-4 h-4" /> Saving...
                        </>
                    ) : 'Save Activity'}
                </button>

                {/* INLINE TOAST */}
                {toast && (
                    <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center justify-center w-max z-[100] bg-[#1C1C1E] border ${toast.type === 'error' ? 'border-red-500 text-red-500' : 'border-[#32D74B] text-[#32D74B]'}`}>
                        {toast.message}
                    </div>
                )}
            </div>
        </>
    );
};

export default ManualLogSheet;
