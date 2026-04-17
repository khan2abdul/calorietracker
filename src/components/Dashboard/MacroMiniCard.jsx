import React from 'react';

const MacroMiniCard = ({ label, value, max, color, icon }) => {
    return (
        <div className="flex flex-col p-2.5 rounded-3xl bg-[#1e1e1e] border border-[#2a2a2a] w-full min-w-0 h-[85px] shadow-sm relative overflow-hidden group hover:border-[#404040] transition-colors">
            {/* Header: Icon + Simple Label */}
            <div className="flex items-center gap-1.5 mb-1 shrink-0 px-0.5">
                <span className="text-[14px] leading-none">{icon}</span>
                <span className="text-[9px] uppercase font-black text-[#777] tracking-[0.05em] truncate">{label}</span>
            </div>
            
            {/* Main Content: Large Value */}
            <div className="flex flex-col justify-center flex-grow px-0.5">
                <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-[18px] font-[900] text-white tracking-tight">{Math.round(value)}</span>
                    <span className="text-[10px] font-bold text-[#555] lowercase">g</span>
                </div>
                
                {/* Secondary: Goal Target */}
                <div className="mt-0.5 flex items-center">
                    <span className="text-[10px] font-medium text-[#444] tracking-tighter leading-none">
                        of {max}g
                    </span>
                </div>
            </div>

            {/* Micro Progress Track */}
            <div className="absolute top-0 right-0 bottom-0 w-[3px] bg-[#121212]/30">
                <div 
                    className="w-full absolute bottom-0 left-0 transition-all duration-1000 ease-out rounded-full" 
                    style={{ 
                        height: `max(4px, ${Math.min((value / max) * 100, 100)}%)`, 
                        backgroundColor: color 
                    }} 
                />
            </div>
        </div>
    );
};

export default MacroMiniCard;
