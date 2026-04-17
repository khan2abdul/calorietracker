import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Calendar, Weight, LogOut, Ruler, Target, Camera, Edit2, Save, X, Loader2, Sparkles, Clock } from 'lucide-react';
import { THEMES } from '../theme';
import { storage, auth, db } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import ReportsView from './ReportsView';

const TARGET_DAY_OPTIONS = [30, 45, 60, 75, 90, 'Auto'];

const UserProfileView = ({ user, userStats, onUpdateStats, onLogout, theme }) => {
    const styles = THEMES[theme];
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempStats, setTempStats] = useState(userStats || {});
    const [feedbackStatus, setFeedbackStatus] = useState('idle');
    const [avatarUrl, setAvatarUrl] = useState(user?.photoURL);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setAvatarUrl(user?.photoURL);
    }, [user?.photoURL]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleEditClick = () => {
        setTempStats(userStats);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempStats(userStats);
    };

    const handleSave = () => {
        onUpdateStats(tempStats);
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setTempStats(prev => ({ ...prev, [field]: value }));
    };

    const handleTargetDaysChange = (days) => {
        onUpdateStats({ targetDays: days });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `profile_images/${user.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            await updateProfile(auth.currentUser, { photoURL });
            const { doc, setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', user.uid), { photoURL }, { merge: true });
            setAvatarUrl(photoURL);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in px-6 pt-14 max-w-lg mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Profile</h1>
                    <p className={`text-sm font-medium ${styles.textSec} opacity-80`}>Your personal hub</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-8 border transition-all ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-5 group cursor-pointer" onClick={handleImageClick}>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <div className={`w-28 h-28 rounded-full border-[6px] relative overflow-hidden ${theme === 'dark' ? 'border-[#1C1C1E]' : 'border-white'} shadow-2xl`}>
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>
                            ) : (
                                <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} alt="Avatar" className="w-full h-full object-cover bg-gray-200" />
                            )}
                        </div>
                        <div className={`absolute bottom-1 right-1 p-2 rounded-full border-4 transition-transform group-hover:scale-110 ${theme === 'dark' ? 'bg-blue-600 border-[#1C1C1E] text-white' : 'bg-blue-500 border-white text-white'}`}>
                            <Camera size={14} />
                        </div>
                    </div>
                    <h2 className={`text-2xl font-bold ${styles.textMain} mb-1`}>{user?.displayName || 'Guest User'}</h2>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        <Mail size={12} />
                        {user?.email || 'No email connected'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className={`text-lg font-bold ${styles.textMain}`}>Personal Details</h3>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}><X size={16} /></button>
                            <button onClick={handleSave} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Save size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={handleEditClick} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${theme === 'dark' ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Edit2 size={12} /> Edit</button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatItem icon={<Calendar size={20} />} label="Age" field="age" value={userStats?.age} unit="yrs" colorClass={theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <StatItem icon={<Weight size={20} />} label="Weight" field="weight" value={userStats?.weight} unit="kg" colorClass={theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'} isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <StatItem icon={<Ruler size={20} />} label="Height" field="height" value={userStats?.height} unit="cm" colorClass={theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'} isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <StatItem icon={<Target size={20} />} label="Goal" field="targetWeight" value={userStats?.targetWeight} unit="kg" colorClass={theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'} isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                </div>
            </div>

            {/* Target Timeline Section */}
            {userStats?.targetWeight && userStats?.weight && userStats.targetWeight !== userStats.weight && (
                <div className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/30 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}><Clock size={20} /></div>
                        <div>
                            <h3 className={`text-lg font-bold ${styles.textMain}`}>Target Timeline</h3>
                            <p className={`text-xs ${styles.textSec}`}>{Math.abs(userStats.weight - userStats.targetWeight)} kg to {userStats.targetWeight < userStats.weight ? 'lose' : 'gain'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {TARGET_DAY_OPTIONS.map(days => {
                            const isActive = (userStats?.targetDays || 90) === days;
                            return (
                                <button key={days} onClick={() => handleTargetDaysChange(days)} className={`flex-1 min-w-[52px] py-3 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                                    <span className="relative z-10">{days}</span>
                                    <span className={`block text-[9px] font-medium mt-0.5 relative z-10 ${isActive ? 'text-white/80' : 'opacity-50'}`}>days</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={`mt-8 mb-8 border-t border-b py-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <ReportsView theme={theme} isDark={theme === 'dark'} user={user} />
            </div>

            <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5 shadow-lg' : (theme === 'wooden' ? 'bg-[#EAD8B1]/30 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}><Sparkles size={18} /></div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Feedback & Suggestions</h3>
                        <p className={`text-xs ${styles.textSec}`}>Help us improve Calorify.AI</p>
                    </div>
                </div>
                <textarea id="feedback-input" className={`w-full p-4 rounded-xl text-sm mb-3 outline-none resize-none transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-50 text-gray-800'}`} rows={3} placeholder="Have an idea?" />
                <button
                    onClick={async () => {
                        const input = document.getElementById('feedback-input');
                        const text = input.value.trim();
                        if (!text) return;
                        setFeedbackStatus('sending');
                        try {
                            const { addDoc, collection } = await import('firebase/firestore');
                            await addDoc(collection(db, 'feedback'), { uid: user.uid, email: user.email, text: text, timestamp: new Date() });
                            input.value = '';
                            setFeedbackStatus('success');
                            setTimeout(() => setFeedbackStatus('idle'), 3000);
                        } catch (e) { setFeedbackStatus('error'); }
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                >
                    {feedbackStatus === 'sending' ? <Loader2 size={16} className="animate-spin" /> : 'Submit Feedback'}
                </button>
            </div>

            <div className="pt-2">
                <button onClick={onLogout} className={`group w-full py-4 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'}`}>
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </div>
    );
};

const StatItem = ({ icon, label, field, value, unit, colorClass, isEditing, tempStats, handleChange, theme, styles }) => (
    <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all ${theme === 'dark' ? 'bg-[#2C2C2E]/50 border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm')}`}>
        <div className={`p-3.5 rounded-2xl ${colorClass}`}>{icon}</div>
        <div className="text-center w-full">
            {isEditing ? (
                <input type="number" value={tempStats[field] || ''} onChange={(e) => handleChange(field, e.target.value)} className={`w-full text-center text-xl font-bold bg-transparent border-b-2 outline-none ${theme === 'dark' ? 'border-white/20 text-white' : 'border-gray-200 text-gray-800'}`} />
            ) : (
                <span className={`text-2xl font-bold block ${styles.textMain}`}>{value || '--'} <span className="text-xs font-medium opacity-60">{unit}</span></span>
            )}
            <span className={`text-xs font-medium uppercase tracking-wide opacity-70 ${styles.textSec}`}>{label}</span>
        </div>
    </div>
);

export default UserProfileView;
