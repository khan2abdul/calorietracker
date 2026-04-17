import React from 'react';
import { LayoutGrid, BookOpen, Activity, User, Plus } from 'lucide-react';
import { THEMES } from '../theme';

const NavButton = ({ active, onClick, icon: Icon, label, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group
            ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'}
            `}
        >
            <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                ${active 
                    ? 'bg-[#0A84FF] text-white shadow-lg shadow-blue-500/40 rotate-[10deg]' 
                    : (theme === 'wooden' ? 'bg-[#3E2723]/5 text-[#3E2723] group-hover:bg-[#3E2723]/10' : 'bg-transparent text-gray-400 group-hover:bg-white/5')
                }
            `}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? (theme === 'wooden' ? 'text-[#3E2723]' : 'text-white') : styles.textSec}`}>{label}</span>
        </button>
    );
};

const Navigation = ({ currentView, onViewChange, onAddClick, theme }) => {
    const styles = THEMES[theme] || THEMES.dark;

    return (
        <>
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-3 px-6 py-4 rounded-[2.5rem] border shadow-2xl transition-all duration-500 backdrop-blur-3xl
                ${theme === 'wooden' ? 'bg-[#EAD8B1]/90 border-[#8B4513]/20 shadow-[#3E2723]/20' : 'bg-[#1C1C1E]/80 border-white/5 shadow-black'}
            `}>
                <NavButton active={currentView === 'home'} onClick={() => onViewChange('home')} icon={LayoutGrid} label="Home" theme={theme} />
                <NavButton active={currentView === 'diary'} onClick={() => onViewChange('diary')} icon={BookOpen} label="Diary" theme={theme} />

                <div className="mx-2">
                    <button
                        onClick={onAddClick}
                        className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-[#0A84FF] to-[#30D158] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 active:scale-90 transition-all hover:rotate-90 duration-500"
                    >
                        <Plus size={32} strokeWidth={3} />
                    </button>
                </div>

                <NavButton active={currentView === 'workout' || currentView === 'tracking' || currentView === 'session-detail'} onClick={() => onViewChange('workout')} icon={Activity} label="Work" theme={theme} />
                <NavButton active={currentView === 'profile'} onClick={() => onViewChange('profile')} icon={User} label="Profile" theme={theme} />
            </div>
            
            <div className={`fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-[40] transition-all duration-500
                ${theme === 'wooden' ? 'bg-gradient-to-t from-[#C19A6B] to-transparent' : 'bg-gradient-to-t from-black to-transparent'}
            `} />
        </>
    );
};

export default Navigation;
