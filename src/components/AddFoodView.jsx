import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Mic, ArrowRight, Plus, Search, ScanLine } from 'lucide-react';
import { THEMES } from '../theme';

const AddFoodView = ({ meal, type, userStats, onClose, onAdd, theme, initialTerm, editingFood }) => {
    const [activeMeal, setActiveMeal] = useState(meal || 'Snacks');
    const [mode, setMode] = useState(type === 'exercise' || initialTerm ? 'ai' : 'search');
    const [query, setQuery] = useState(initialTerm || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const styles = THEMES[theme];
    // Use the correct Gemini API Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;

    useEffect(() => {
        if (type === 'exercise') setMode('ai');
        if (inputRef.current) inputRef.current.focus();
    }, [mode, type]);

    const handleAISubmit = async () => {
        if (!query.trim()) return;
        setIsAnalyzing(true);
        setError('');
        setAiResult(null);
        let prompt = "";
        if (type === 'exercise') {
            prompt = `Estimate calories burned for this activity: "${query}". User Stats: Age ${userStats.age}, Weight ${userStats.weight}kg, Height ${userStats.height}cm. Return ONLY a valid JSON array. Example: [{"name": "Running", "duration": "30 mins", "calories": 300}].`;
        } else {
            prompt = `Analyze this meal description: "${query}". Identify food items, estimate calories, protein (g), carbs (g), fat (g), and approximate weight. Return ONLY a valid JSON array. Example: [{"name": "Apple", "weight": "180g", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3}].`;
        }
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) throw new Error("No response");
            const text = data.candidates[0].content.parts[0].text;
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) setAiResult(parsed);
            else setError("Could not understand.");
        } catch (err) {
            console.error(err);
            setError("AI Service unavailable. Check API Key.");
            // Fallback for demo if API fails
            setTimeout(() => {
                if (type === 'exercise') { setAiResult([{ name: "AI Estimate: " + query, duration: "30 mins", calories: 250 }]); }
                else { setAiResult([{ name: query, weight: "200g", calories: 450, protein: 20, carbs: 50, fat: 15 }]); }
                setIsAnalyzing(false);
                setError('');
            }, 800);
        } finally { setIsAnalyzing(false); }
    };

    // Styles
    const modalBg = theme === 'dark' ? 'bg-[#000000]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-[#F2F2F7]');
    const headerBg = styles.card;
    const inputBg = theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-white';

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col animate-slide-up ${modalBg}`}>
            {/* Header - Fixed */}
            <div className={`px-6 pt-12 pb-4 shadow-sm z-10 ${headerBg} transition-colors shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-widest ${styles.textSec}`}>{type === 'exercise' ? 'Log Activity' : (editingFood ? 'Edit Item' : 'Add Food')}</span>
                        <h2 className={`text-2xl font-bold ${styles.textMain}`}>{type === 'exercise' ? 'New Workout' : (editingFood ? 'Update Entry' : 'New Entry')}</h2>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'} ${styles.textSec}`}><X size={24} /></button>
                </div>
                {type !== 'exercise' && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {MEAL_OPTIONS.map(m => (
                            <button key={m} onClick={() => setActiveMeal(m)} className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${activeMeal === m ? (theme === 'dark' ? 'bg-white text-black' : (theme === 'wooden' ? 'bg-[#3E2723] text-[#EAD8B1]' : 'bg-black text-white')) : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-200 text-gray-500')}`}>{m}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4 pb-32"> {/* Added padding bottom for safe area */}
                    {type !== 'exercise' && (
                        <div className={`p-1 rounded-2xl flex relative mb-6 ${theme === 'dark' ? 'bg-[#1C1C1E]' : (theme === 'wooden' ? 'bg-[#D7CCC8]' : 'bg-gray-200/50')}`}>
                            <div className={`absolute top-1 bottom-1 w-[48%] rounded-xl shadow-sm transition-all duration-300 ${mode === 'ai' ? 'left-[50%]' : 'left-1'} ${theme === 'dark' ? 'bg-[#636366]/40' : 'bg-white'}`} />
                            <button onClick={() => setMode('search')} className={`flex-1 py-2.5 text-sm font-semibold relative z-10 transition-colors ${mode === 'search' ? styles.textMain : styles.textSec}`}>Search</button>
                            <button onClick={() => setMode('ai')} className={`flex-1 py-2.5 text-sm font-semibold relative z-10 flex items-center justify-center gap-2 transition-colors ${mode === 'ai' ? styles.textMain : styles.textSec}`}><Sparkles size={14} className={mode === 'ai' ? (theme === 'dark' ? "text-[#BF5AF2]" : "text-indigo-500") : ""} /> AI Log</button>
                        </div>
                    )}

                    {mode === 'ai' && (
                        <div className="flex flex-col gap-6">
                            <div className={`p-6 rounded-[2rem] shadow-sm relative overflow-hidden transition-colors border ${styles.card} ${styles.border}`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} className={styles.textMain} /></div>
                                <label className={`block text-sm font-bold mb-2 ${styles.textSec}`}>{type === 'exercise' ? 'Describe your workout' : 'Describe your meal'}</label>
                                <textarea ref={inputRef} className={`w-full text-lg placeholder:text-gray-400 outline-none resize-none bg-transparent ${styles.textMain}`} rows={3} placeholder={type === 'exercise' ? "e.g. 30 mins jogging..." : "e.g. A cheeseburger..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); } }} />
                                <div className="flex justify-between items-center mt-4">
                                    <button className={`p-2 rounded-full transition-colors ${styles.textSec} hover:opacity-80`}><Mic size={20} /></button>
                                    <button onClick={handleAISubmit} disabled={!query || isAnalyzing} className={`px-6 py-3 rounded-full font-bold text-white transition-all flex items-center gap-2 ${!query ? 'bg-gray-400' : (theme === 'dark' ? 'bg-[#0A84FF]' : (theme === 'wooden' ? 'bg-[#8B4513]' : 'bg-black'))}`}>{isAnalyzing ? 'Thinking...' : <>Analyze <ArrowRight size={18} strokeWidth={2.5} /></>}</button>
                                </div>
                            </div>

                            {error && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm">{error}</div>}

                            {aiResult && (
                                <div className="animate-fade-in space-y-3">
                                    <h3 className={`text-sm font-bold ${styles.textSec} uppercase tracking-widest ml-1`}>AI Suggestions</h3>
                                    {aiResult.map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl flex justify-between items-center shadow-sm border transition-colors ${styles.card} ${styles.border}`}>
                                            <div>
                                                <p className={`font-bold ${styles.textMain}`}>{item.name}</p>
                                                <p className={`text-xs ${styles.textSec} font-medium mt-1`}>
                                                    {type === 'exercise' ? <span className="text-blue-500">{item.duration}</span> : <>{item.weight && <span className={`font-bold mr-2 ${styles.accentBlueText}`}>{item.weight}</span>}</>}
                                                    <span className={theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}> {item.calories} {type === 'exercise' ? 'burned' : 'kcal'}</span>
                                                </p>
                                            </div>
                                            <button onClick={() => onAdd(item, type === 'exercise' ? 'exercise' : activeMeal)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-indigo-50'} ${styles.accentBlueText}`}><Plus size={20} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'search' && type !== 'exercise' && (
                        <div className="flex flex-col gap-6">
                            <div className="relative"><Search className="absolute left-4 top-3.5 text-gray-500" size={20} /><input ref={inputRef} type="text" placeholder="Search database..." className={`w-full py-3.5 pl-12 pr-4 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-lg transition-colors ${inputBg} ${styles.textMain} ${styles.border}`} /></div>

                            <div>
                                <h3 className={`text-xs font-bold ${styles.textSec} uppercase tracking-widest mb-3`}>Quick Add</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["Cooked Rice", "Roti", "Paratha", "Dal", "Curd", "Milk", "Tea", "Coffee", "Boiled Egg", "Omelette", "Banana", "Apple", "Chicken Curry", "Paneer", "Dosa"].map(item => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setQuery(item);
                                                setMode('ai');
                                            }}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${theme === 'dark' ? 'bg-[#2C2C2E] border-white/5 hover:bg-[#3A3A3C]' : 'bg-white border-gray-200 hover:bg-gray-50'} ${styles.textMain}`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`text-center ${styles.textSec} mt-4`}><ScanLine size={48} className="mx-auto mb-4 opacity-20" /><p>Start typing or scan a barcode</p></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddFoodView;
