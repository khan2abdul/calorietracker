import React, { useState, useRef } from 'react';
import { User, Mail, Calendar, Weight, LogOut, Ruler, Target, Camera, Edit2, Save, X, Loader2 } from 'lucide-react';
import { THEMES } from '../theme';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const UserProfileView = ({ user, userStats, setUserStats, onLogout, theme }) => {
    const styles = THEMES[theme];
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempStats, setTempStats] = useState(userStats || {});
    const fileInputRef = useRef(null);

    const handleEditClick = () => {
        setTempStats(userStats);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempStats(userStats);
    };

    const handleSave = () => {
        setUserStats(tempStats);
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setTempStats(prev => ({ ...prev, [field]: value }));
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
            // Force refresh to update UI
            window.location.reload();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const StatItem = ({ icon, label, field, value, unit, colorClass }) => (
        <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] ${theme === 'dark' ? 'bg-[#2C2C2E]/50 border-white/5 hover:bg-[#2C2C2E]' : (theme === 'wooden' ? 'bg-[#EAD8B1]/50 border-[#8B4513]/10' : 'bg-white border-gray-100 shadow-sm hover:shadow-md')}`}>
            <div className={`p-3.5 rounded-2xl ${colorClass}`}>
                {icon}
            </div>
            <div className="text-center w-full">
                {isEditing ? (
                    <input
                        type="number"
                        value={tempStats[field] || ''}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className={`w-full text-center text-xl font-bold bg-transparent border-b-2 outline-none ${theme === 'dark' ? 'border-white/20 focus:border-blue-500 text-white' : 'border-gray-200 focus:border-blue-500 text-gray-800'}`}
                        autoFocus={field === 'age'}
                    />
                ) : (
                    <span className={`text-2xl font-bold block ${styles.textMain}`}>{value || '--'} <span className="text-xs font-medium opacity-60">{unit}</span></span>
                )}
                <span className={`text-xs font-medium uppercase tracking-wide opacity-70 ${styles.textSec}`}>{label}</span>
            </div>
        </div>
    );

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
            <div className={`relative overflow-hidden rounded-[2.5rem] p-8 border transition-all ${theme === 'dark' ? 'bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] border-white/5' : (theme === 'wooden' ? 'bg-gradient-to-br from-[#EAD8B1] to-[#D7CCC8] border-[#8B4513]/10' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-xl shadow-gray-200/50')}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none text-blue-500"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-5 group cursor-pointer" onClick={handleImageClick}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <div className={`absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                        <div className={`w-28 h-28 rounded-full border-[6px] relative overflow-hidden ${theme === 'dark' ? 'border-[#1C1C1E]' : 'border-white'} shadow-2xl`}>
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/50">
                                    <Loader2 className="animate-spin text-white" />
                                </div>
                            ) : (
                                <img
                                    src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover bg-gray-200"
                                />
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
                            <button onClick={handleCancel} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                <X size={16} />
                            </button>
                            <button onClick={handleSave} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <Save size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleEditClick} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${theme === 'dark' ? 'bg-white/5 text-blue-400 hover:bg-white/10' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                            <Edit2 size={12} /> Edit
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatItem
                        icon={<Calendar size={20} />}
                        label="Age"
                        field="age"
                        value={userStats?.age}
                        unit="yrs"
                        colorClass={theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}
                    />
                    <StatItem
                        icon={<Weight size={20} />}
                        label="Weight"
                        field="weight"
                        value={userStats?.weight}
                        unit="kg"
                        colorClass={theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}
                    />
                    <StatItem
                        icon={<Ruler size={20} />}
                        label="Height"
                        field="height"
                        value={userStats?.height}
                        unit="cm"
                        colorClass={theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}
                    />
                    <StatItem
                        icon={<Target size={20} />}
                        label="Goal"
                        field="targetWeight"
                        value={userStats?.targetWeight}
                        unit="kg"
                        colorClass={theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-6">
                <button
                    onClick={onLogout}
                    className={`group w-full py-4 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] ${theme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                    <div className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-red-500/20 group-hover:bg-red-500/30' : 'bg-red-100 group-hover:bg-red-200'}`}>
                        <LogOut size={18} />
                    </div>
                    Sign Out
                </button>
            </div>

            <div className={`text-center text-xs mt-8 ${styles.textSec} opacity-40 font-medium tracking-widest uppercase`}>
                FitTrack AI v1.0.0
            </div>
        </div>
    );
};

export default UserProfileView;
