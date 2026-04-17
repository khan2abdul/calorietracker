import React from 'react';

const MacroMiniCard = ({ label, value, max, color, icon }) => {
    const progress = (value / max) * 100;
    const isOver = value > max;
    const remaining = max - value;
    
    return (
        <div className="flex flex-col pt-3 px-2.5 rounded-[12px] bg-[#1e1e1e] border border-white/5 w-full min-w-0 min-h-[90px] shadow-lg relative overflow-hidden transition-all duration-300">
            {/* Top Row: Icon + Label + Badge */}
            <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] shrink-0">{icon}</span>
                    <span className="text-[8.5px] uppercase font-bold text-[#888] tracking-wider truncate">{label}</span>
                </div>
                <div className={`text-[9.5px] font-black shrink-0 ${isOver ? 'text-[#E05050]' : ''}`} style={{ color: isOver ? undefined : color }}>
                    {isOver ? 'Over!' : `${Math.round(progress)}%`}
                </div>
            </div>
            
            {/* Middle Row: Large Value + g */}
            <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-[22px] font-[800] leading-none tracking-tight transition-colors duration-500" style={{ color: isOver ? color : 'white' }}>
                    {Math.round(value)}
                </span>
                <span className="text-[12px] font-normal text-[#888]">g</span>
            </div>

            {/* Sub-label: Remaining / Goal Met */}
            <div className="mt-1 mb-3">
                {isOver ? (
                    <span className="text-[11px] font-bold text-[#E05050]">+{Math.round(Math.abs(remaining))}g over</span>
                ) : remaining <= 0 ? (
                    <span className="text-[11px] font-bold" style={{ color: color }}>Goal met ✓</span>
                ) : (
                    <span className="text-[11px] font-medium text-[#888]">{Math.round(remaining)}g left</span>
                )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-black/20">
                <div 
                    className="h-full transition-all duration-1000 ease-out rounded-t-[2px]" 
                    style={{ 
                        width: `${Math.max(6, Math.min(progress, 100))}%`, 
                        backgroundColor: isOver ? '#E05050' : color 
                    }} 
                />
            </div>
        </div>
    );
};

export default MacroMiniCard;
