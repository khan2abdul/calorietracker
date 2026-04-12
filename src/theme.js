export const iOSBlurLight = "backdrop-blur-xl bg-gradient-to-b from-white/90 to-blue-50/80 border border-blue-100/30 shadow-lg";
export const iOSBlurDark = "backdrop-blur-xl bg-gradient-to-b from-[#2C2C2E]/95 to-[#1C1C1E]/90 border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(255,255,255,0.05)]";
export const iOSBlurWooden = "backdrop-blur-xl bg-gradient-to-b from-[#F5DEB3]/95 to-[#EAD8B1]/90 border-t border-[#8B4513]/20 shadow-lg";

export const THEMES = {
    light: {
        bg: 'bg-[#F2F2F7]',
        card: 'bg-white',
        textMain: 'text-slate-900',
        textSec: 'text-gray-500',
        border: 'border-slate-100',
        accentBlue: 'bg-blue-500',
        accentBlueText: 'text-blue-600',
        ringTrack: '#F2F2F7',
        chart: { p: '#3b82f6', c: '#10b981', f: '#f97316' },
        navBlur: iOSBlurLight
    },
    dark: {
        bg: 'bg-[#000000]',
        card: 'bg-[#1C1C1E]',
        textMain: 'text-white',
        textSec: 'text-gray-400',
        border: 'border-white/10',
        accentBlue: 'bg-[#0A84FF]',
        accentBlueText: 'text-[#0A84FF]',
        ringTrack: '#2C2C2E',
        chart: { p: '#0A84FF', c: '#32D74B', f: '#FF9F0A' },
        navBlur: iOSBlurDark
    },
    wooden: {
        bg: 'bg-[#C19A6B]', // Darker Camel/Wood
        card: 'bg-[#EADDCA]', // Darker Almond
        textMain: 'text-[#3E2723]', // Dark Brown
        textSec: 'text-[#5D4037]', // Medium Brown
        border: 'border-[#5D4037]/20',
        accentBlue: 'bg-[#8D6E63]',
        accentBlueText: 'text-[#8D6E63]',
        ringTrack: '#C19A6B',
        chart: { p: '#556B2F', c: '#3E2723', f: '#8B4513' },
        navBlur: iOSBlurWooden
    }
};

export const GRAPH_COLORS = {
    light: { consumed: '#22D3EE', burned: '#A855F7', net: '#4ADE80' },
    dark: { consumed: '#22D3EE', burned: '#BF5AF2', net: '#32D74B' },
    wooden: { consumed: '#6B8E23', burned: '#8B4513', net: '#556B2F' }
};
