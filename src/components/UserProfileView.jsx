import React from 'react';
import { User, Mail, Calendar, Weight, LogOut, ChevronRight, Ruler, Target } from 'lucide-react';
import { THEMES } from '../theme';

const UserProfileView = ({ user, userStats, onLogout, theme }) => {
    const styles = THEMES[theme];

    const StatItem = ({ icon, label, value, unit }) => (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5' : (theme === 'wooden' ? 'bg-[#EAD8B1] border-[#8B4513]/10' : 'bg-white border-gray-100')}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : (theme === 'wooden' ? 'bg-[#D7CCC8] text-[#5D4037]' : 'bg-gray-100 text-gray-600')}`}>
                    {icon}
                </div>
                <span className={`font-medium ${styles.textSec}`}>{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold ${styles.textMain}`}>{value || '--'}</span>
                {unit && <span className={`text-xs ${styles.textSec}`}>{unit}</span>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-32 animate-fade-in px-6 pt-14">
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-3xl font-extrabold tracking-tight ${styles.textMain}`}>Profile</h1>
            </div>

            {/* Profile Card */}
            <div className={`rounded-[2rem] p-6 border flex flex-col items-center text-center relative overflow-hidden ${styles.card} ${styles.border}`}>
                <div className={`w-24 h-24 rounded-full border-4 mb-4 overflow-hidden ${theme === 'dark' ? 'border-[#2C2C2E]' : 'border-white'} shadow-xl`}>
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`}
                        alt="Avatar"
                        className="w-full h-full object-cover bg-gray-200"
                    />
                </div>
                <h2 className={`text-2xl font-bold ${styles.textMain}`}>{user?.displayName || 'User'}</h2>
                <p className={`text-sm font-medium ${styles.textSec} flex items-center gap-1.5 mt-1`}>
                    <Mail size={14} />
                    {user?.email}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="space-y-3">
                <h3 className={`text-lg font-bold px-1 ${styles.textMain}`}>Personal Details</h3>
                <div className="grid grid-cols-1 gap-3">
                    <StatItem icon={<Calendar size={18} />} label="Age" value={userStats?.age} unit="years" />
                    <StatItem icon={<Weight size={18} />} label="Weight" value={userStats?.weight} unit="kg" />
                    <StatItem icon={<Ruler size={18} />} label="Height" value={userStats?.height} unit="cm" />
                    <StatItem icon={<Target size={18} />} label="Goal" value={userStats?.targetWeight} unit="kg" />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
                <button
                    onClick={onLogout}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>

            <div className={`text-center text-xs mt-8 ${styles.textSec} opacity-50`}>
                FitTrack AI v1.0.0
            </div>
        </div>
    );
};

export default UserProfileView;
