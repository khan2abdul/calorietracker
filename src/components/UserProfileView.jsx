import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Calendar, Weight, LogOut, Ruler, Target, Camera, Edit2, Save, X, Loader2, Sparkles, Clock, History } from 'lucide-react';
import { THEMES } from '../theme';
import { storage, auth, db } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import PerformanceReports from './ReportsView.jsx';
import { TARGET_DAY_OPTIONS } from '../config';

const UserProfileView = ({ user, userStats, onUpdateStats, onLogout, theme, onLogWeight }) => {
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
        if (tempStats.weight !== userStats.weight && onLogWeight) {
            onLogWeight(tempStats.weight);
        }
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
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14 max-w-lg mx-auto">
            {/* Minimal Header */}
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className={`text-4xl font-black tracking-tight ${styles.textMain}`}>Profile</h1>
                    <p className={`text-xs font-bold uppercase tracking-widest opacity-40 ${styles.textSec}`}>Identity & Metrics</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}><X size={20} /></button>
                            <button onClick={handleSave} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}><Save size={20} /></button>
                        </>
                    ) : (
                        <button onClick={handleEditClick} className={`p-3 rounded-2xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}><Edit2 size={20} /></button>
                    )}
                </div>
            </div>

            {/* Profile Bento */}
            <div className="grid grid-cols-1 gap-4">
                {/* Identity Card */}
                <div className={`p-6 rounded-[2.5rem] border relative overflow-hidden group ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="relative group cursor-pointer" onClick={handleImageClick}>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                             <div className={`w-20 h-20 rounded-full border-4 ${theme === 'dark' ? 'border-[#2C2C2E]' : 'border-gray-50'} overflow-hidden shadow-xl`}>
                                 {uploading ? (
                                     <div className="w-full h-full flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>
                                 ) : (
                                     <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} alt="Avatar" className="w-full h-full object-cover bg-gray-200" />
                                 )}
                             </div>
                             <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-500 text-white shadow-lg"><Camera size={10} /></div>
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${styles.textMain}`}>{user?.displayName || 'Guest User'}</h2>
                            <p className={`text-xs font-medium opacity-50 ${styles.textSec}`}>{user?.email || 'No email connected'}</p>
                            <button onClick={onLogout} className="mt-2 text-[10px] font-black uppercase tracking-tighter text-red-500 hover:opacity-80 flex items-center gap-1"><LogOut size={10}/> Sign Out</button>
                        </div>
                    </div>
                </div>

                {/* Body Metrics Group */}
                <div className="grid grid-cols-3 gap-3">
                    <CompactStatItem icon={<Calendar size={14} />} label="Age" field="age" value={userStats?.age} unit="yr" color="blue" isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <CompactStatItem icon={<Ruler size={14} />} label="Height" field="height" value={userStats?.height} unit="cm" color="orange" isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <CompactStatItem icon={<Weight size={14} />} label="Current" field="weight" value={userStats?.weight} unit="kg" color="green" isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                </div>

                {/* Progress Group */}
                <div className="grid grid-cols-3 gap-3">
                    <CompactStatItem icon={<History size={14} />} label="Initial" field="initialWeight" value={userStats?.initialWeight} unit="kg" color="cyan" isEditing={false} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <CompactStatItem icon={<Target size={14} />} label="Goal" field="targetWeight" value={userStats?.targetWeight} unit="kg" color="purple" isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} />
                    <CompactStatItem icon={<Clock size={14} />} label="Started" field="startDate" value={userStats?.startDate ? new Date(userStats.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '--'} unit="" color="yellow" isEditing={isEditing} tempStats={tempStats} handleChange={handleChange} theme={theme} styles={styles} inputType="date" />
                </div>
            </div>

            {/* Target Timeline - Integrated more naturally */}
            {userStats?.targetWeight && userStats?.weight && userStats.targetWeight !== userStats.weight && (
                <div className={`p-6 rounded-[2.5rem] border overflow-hidden relative ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full"></div>
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Clock size={20} /></div>
                            <div>
                                <h3 className={`text-md font-black ${styles.textMain}`}>Target Timeline</h3>
                                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">{(Math.abs(userStats.weight - userStats.targetWeight)).toFixed(1)} kg to {userStats.targetWeight < userStats.weight ? 'lose' : 'gain'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 relative z-10">
                        {TARGET_DAY_OPTIONS.map(days => {
                            const isActive = (userStats?.targetDays || 90) === days;
                            return (
                                <button key={days} onClick={() => handleTargetDaysChange(days)} className={`flex-1 min-w-[50px] py-3 rounded-2xl font-black text-xs transition-all active:scale-95 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-500 border border-white/5' : 'bg-gray-50 text-gray-400 border border-gray-100')}`}>
                                    {days}
                                    <span className={`block text-[8px] font-bold mt-0.5 opacity-50`}>days</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <PerformanceReports theme={theme} user={user} minimal={false} onLogWeight={onLogWeight} />
            </div>

            {/* Subtle Feedback Footer */}
            <div className={`p-6 rounded-[2.5rem] border border-dashed ${theme === 'dark' ? 'border-white/10 opacity-60 hover:opacity-100' : 'border-gray-200 opacity-80 hover:opacity-100'} transition-opacity`}>
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span className={`text-xs font-black uppercase tracking-widest ${styles.textMain}`}>Feedback</span>
                </div>
                <textarea id="feedback-input" className={`w-full p-4 rounded-2xl text-xs mb-3 outline-none resize-none transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-50 text-gray-800'}`} rows={2} placeholder="How can we make this better? 🚀" />
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
                    className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                >
                    {feedbackStatus === 'sending' ? <Loader2 size={12} className="animate-spin" /> : (feedbackStatus === 'success' ? 'Sent! ✨' : 'Send Feedback')}
                </button>
            </div>
        </div>
    );
};

const CompactStatItem = ({ icon, label, field, value, unit, color, isEditing, tempStats, handleChange, theme, styles, inputType = "number" }) => {
    const colorClasses = {
        blue: theme === 'dark' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100',
        green: theme === 'dark' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-green-600 bg-green-50 border-green-100',
        orange: theme === 'dark' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-orange-600 bg-orange-50 border-orange-100',
        purple: theme === 'dark' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-purple-600 bg-purple-50 border-purple-100',
        cyan: theme === 'dark' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-cyan-600 bg-cyan-50 border-cyan-100',
        yellow: theme === 'dark' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-yellow-600 bg-yellow-50 border-yellow-100',
    };

    return (
        <div className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'bg-[#1C1C1E] border-white/5 shadow-inner shadow-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className={`p-2 rounded-xl border ${colorClasses[color]}`}>{icon}</div>
            <div className="text-center w-full min-h-[38px] flex flex-col justify-center">
                {isEditing ? (
                    <input 
                        type={inputType} 
                        value={inputType === 'date' && tempStats[field] ? new Date(tempStats[field]).toISOString().split('T')[0] : (tempStats[field] || '')} 
                        onChange={(e) => handleChange(field, inputType === 'date' ? new Date(e.target.value + 'T00:00:00').toISOString() : e.target.value)} 
                        className={`w-full text-center text-sm font-black bg-transparent border-b outline-none ${theme === 'dark' ? 'border-white/10 text-white' : 'border-gray-100 text-gray-800'}`} 
                    />
                ) : (
                    <p className={`text-md font-black block ${styles.textMain} leading-tight`}>{value || '--'}<span className="text-[9px] font-bold opacity-30 ml-0.5">{unit}</span></p>
                )}
                <span className={`text-[8px] font-black uppercase tracking-tighter opacity-40 ${styles.textSec}`}>{label}</span>
            </div>
        </div>
    );
};

export default UserProfileView;
