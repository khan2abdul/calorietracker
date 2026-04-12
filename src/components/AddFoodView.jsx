import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Mic, ArrowRight, Plus, Search, ScanLine, Edit2, Clock, ChevronDown, Undo2, Check, AlertCircle, HelpCircle, Zap, Star, Filter, TrendingUp } from 'lucide-react';
import { THEMES } from '../theme';

// ==========================================
// CONSTANTS & DATA
// ==========================================

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

// Contextual placeholder examples for Indian users
const PLACEHOLDER_EXAMPLES = [
    "e.g., 2 chapatis with sabzi, 1 cup chai",
    "e.g., 250g chicken biryani, raita",
    "e.g., 1 bowl dal rice, pickle",
    "e.g., 2 parathas with curd, 1 glass lassi"
];

// Quick add items categorized by meal type
const QUICK_ADD_BY_MEAL = {
    Breakfast: [
        { name: "Tea", portion: "1 cup, 200ml", calories: 45, protein: 1, carbs: 6, fat: 1.5 },
        { name: "Coffee", portion: "1 cup, 200ml", calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: "Milk", portion: "1 glass, 250ml", calories: 150, protein: 8, carbs: 12, fat: 8 },
        { name: "Boiled Egg", portion: "1 large", calories: 78, protein: 6, carbs: 0.5, fat: 5 },
        { name: "Banana", portion: "1 medium, 120g", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: "Apple", portion: "1 medium, 180g", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: "Bread Toast", portion: "2 slices", calories: 160, protein: 5, carbs: 30, fat: 2.5 },
        { name: "Omelette", portion: "2 eggs", calories: 180, protein: 12, carbs: 2, fat: 14 },
        { name: "Paratha", portion: "1 medium, 60g", calories: 180, protein: 4, carbs: 25, fat: 7 },
        { name: "Upma", portion: "1 bowl, 150g", calories: 220, protein: 6, carbs: 35, fat: 7 },
        { name: "Poha", portion: "1 bowl, 150g", calories: 200, protein: 4, carbs: 38, fat: 5 },
        { name: "Idli", portion: "2 pieces", calories: 120, protein: 4, carbs: 24, fat: 0.5 }
    ],
    Lunch: [
        { name: "Cooked Rice", portion: "1 bowl, 150g", calories: 195, protein: 4, carbs: 45, fat: 0.4 },
        { name: "Roti", portion: "1 medium, 40g", calories: 120, protein: 3, carbs: 25, fat: 1 },
        { name: "Dal", portion: "1 bowl, 150g", calories: 150, protein: 9, carbs: 20, fat: 3 },
        { name: "Chicken Curry", portion: "150g", calories: 280, protein: 25, carbs: 8, fat: 18 },
        { name: "Paneer", portion: "100g", calories: 265, protein: 18, carbs: 3, fat: 20 },
        { name: "Curd", portion: "1 bowl, 100g", calories: 60, protein: 3, carbs: 5, fat: 3 },
        { name: "Sabzi", portion: "1 bowl, 150g", calories: 120, protein: 4, carbs: 12, fat: 6 },
        { name: "Raita", portion: "1 bowl, 100g", calories: 70, protein: 3, carbs: 6, fat: 3 },
        { name: "Biryani", portion: "1 plate, 250g", calories: 450, protein: 20, carbs: 55, fat: 18 },
        { name: "Rajma", portion: "1 bowl, 150g", calories: 180, protein: 10, carbs: 28, fat: 4 },
        { name: "Fish Curry", portion: "150g", calories: 200, protein: 22, carbs: 6, fat: 10 },
        { name: "Salad", portion: "1 bowl, 100g", calories: 35, protein: 1, carbs: 7, fat: 0.3 }
    ],
    Dinner: [
        { name: "Cooked Rice", portion: "1 bowl, 150g", calories: 195, protein: 4, carbs: 45, fat: 0.4 },
        { name: "Roti", portion: "1 medium, 40g", calories: 120, protein: 3, carbs: 25, fat: 1 },
        { name: "Dal", portion: "1 bowl, 150g", calories: 150, protein: 9, carbs: 20, fat: 3 },
        { name: "Chicken Curry", portion: "150g", calories: 280, protein: 25, carbs: 8, fat: 18 },
        { name: "Paneer", portion: "100g", calories: 265, protein: 18, carbs: 3, fat: 20 },
        { name: "Curd", portion: "1 bowl, 100g", calories: 60, protein: 3, carbs: 5, fat: 3 },
        { name: "Dosa", portion: "1 large", calories: 168, protein: 4, carbs: 28, fat: 5 },
        { name: "Khichdi", portion: "1 bowl, 200g", calories: 250, protein: 8, carbs: 40, fat: 6 },
        { name: "Soup", portion: "1 bowl, 200ml", calories: 80, protein: 3, carbs: 8, fat: 4 },
        { name: "Chapati", portion: "2 medium", calories: 240, protein: 6, carbs: 50, fat: 2 },
        { name: "Aloo Gobi", portion: "1 bowl, 150g", calories: 140, protein: 3, carbs: 18, fat: 6 },
        { name: "Palak Paneer", portion: "150g", calories: 280, protein: 14, carbs: 10, fat: 22 }
    ],
    Snacks: [
        { name: "Tea", portion: "1 cup, 200ml", calories: 45, protein: 1, carbs: 6, fat: 1.5 },
        { name: "Coffee", portion: "1 cup, 200ml", calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: "Banana", portion: "1 medium, 120g", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: "Apple", portion: "1 medium, 180g", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: "Biscuits", portion: "4 pieces", calories: 120, protein: 2, carbs: 20, fat: 4 },
        { name: "Namkeen", portion: "50g", calories: 260, protein: 5, carbs: 30, fat: 14 },
        { name: "Samosa", portion: "1 piece", calories: 250, protein: 5, carbs: 28, fat: 14 },
        { name: "Pakora", portion: "4 pieces", calories: 200, protein: 4, carbs: 18, fat: 12 },
        { name: "Bhel Puri", portion: "1 plate", calories: 180, protein: 4, carbs: 32, fat: 6 },
        { name: "Vada Pav", portion: "1 piece", calories: 290, protein: 6, carbs: 35, fat: 14 },
        { name: "Sandwich", portion: "1 piece", calories: 200, protein: 7, carbs: 28, fat: 8 },
        { name: "Fruit Chaat", portion: "1 bowl, 150g", calories: 100, protein: 1, carbs: 24, fat: 0.5 }
    ]
};

// Food categories for browse
const FOOD_CATEGORIES = [
    { name: "Vegetables", icon: "🥬", items: 45 },
    { name: "Fruits", icon: "🍎", items: 38 },
    { name: "Grains", icon: "🌾", items: 52 },
    { name: "Proteins", icon: "🍗", items: 41 },
    { name: "Dairy", icon: "🥛", items: 28 },
    { name: "Beverages", icon: "☕", items: 35 },
    { name: "Snacks", icon: "🍿", items: 62 },
    { name: "Fast Food", icon: "🍔", items: 48 }
];

// ==========================================
// HELPER COMPONENTS
// ==========================================

// Loading skeleton for AI suggestions
const SkeletonCard = ({ theme }) => (
    <div className={`p-4 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center">
            <div className="flex-1">
                <div className={`h-5 rounded-lg mb-2 w-32 ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-200'}`} />
                <div className={`h-3 rounded-lg w-48 ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-200'}`} />
            </div>
            <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-200'}`} />
        </div>
    </div>
);

// Toast notification component
const Toast = ({ message, type = 'success', onUndo, onDismiss, theme }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`fixed bottom-24 left-4 right-4 z-[100] animate-slide-up`}>
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl shadow-lg backdrop-blur-xl ${type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                }`}>
                <div className="flex items-center gap-2">
                    {type === 'success' ? <Check size={18} /> : <X size={18} />}
                    <span className="font-medium text-sm">{message}</span>
                </div>
                {onUndo && (
                    <button onClick={onUndo} className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors">
                        <Undo2 size={14} /> Undo
                    </button>
                )}
            </div>
        </div>
    );
};

// Voice recording indicator component
const VoiceRecordingIndicator = ({ isListening, isProcessing, theme }) => {
    if (isProcessing) {
        return (
            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-medium">Converting speech...</span>
            </div>
        );
    }

    if (isListening) {
        return (
            <div className="flex items-center gap-3">
                <div className="relative flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 bg-red-400 rounded-full animate-pulse`}
                            style={{
                                height: `${8 + Math.random() * 12}px`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Listening...</span>
            </div>
        );
    }

    return null;
};

// Confidence indicator component
const ConfidenceIndicator = ({ score, theme }) => {
    if (score >= 0.8) {
        return <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><Check size={12} /> High confidence</span>;
    } else if (score >= 0.5) {
        return <span className="flex items-center gap-1 text-xs text-amber-500 font-medium"><AlertCircle size={12} /> Approximate</span>;
    } else {
        return <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><HelpCircle size={12} /> Estimate only</span>;
    }
};

// Macro progress bar
const MacroBar = ({ label, value, max, color, theme }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className={`w-12 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
        <div className={`flex-1 h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-200'}`}>
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
        </div>
        <span className={`w-8 text-right font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{value}g</span>
    </div>
);

// Weight slider editor
const WeightEditor = ({ value, onChange, onClose, theme }) => {
    const [weight, setWeight] = useState(parseInt(value) || 200);
    const quickWeights = [100, 200, 300, 500];

    return (
        <div className={`absolute inset-0 z-10 flex flex-col rounded-2xl p-4 backdrop-blur-xl ${theme === 'dark' ? 'bg-[#1C1C1E]/95' : 'bg-white/95'}`}>
            <div className="flex justify-between items-center mb-4">
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Adjust Weight</span>
                <button onClick={onClose} className={`p-1 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-100'}`}><X size={16} /></button>
            </div>
            <input
                type="range"
                min="50"
                max="1000"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full h-2 rounded-full accent-blue-500 mb-4"
            />
            <div className="flex justify-between mb-4">
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weight}g</span>
            </div>
            <div className="flex gap-2 mb-4">
                {quickWeights.map(w => (
                    <button key={w} onClick={() => setWeight(w)} className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${weight === w ? (theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-black text-white') : (theme === 'dark' ? 'bg-[#3A3A3C] text-white' : 'bg-gray-100 text-gray-700')}`}>
                        {w}g
                    </button>
                ))}
            </div>
            <button onClick={() => { onChange(weight); onClose(); }} className={`w-full py-3 rounded-xl font-bold text-white ${theme === 'dark' ? 'bg-blue-500' : 'bg-black'}`}>
                Apply
            </button>
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const AddFoodView = ({ meal, type, userStats, onClose, onAdd, theme, initialTerm, editingFood, recentFoods = [], foodPatterns = {} }) => {
    // State management
    const [activeMeal, setActiveMeal] = useState(meal || 'Snacks');
    const [mode, setMode] = useState(type === 'exercise' || initialTerm ? 'ai' : 'ai'); // Default to AI mode
    const [query, setQuery] = useState(initialTerm || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [error, setError] = useState('');
    const [analysisStep, setAnalysisStep] = useState('');
    const [showSearchOverlay, setShowSearchOverlay] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState(['Pizza', 'Chicken', 'Rice', 'Apple', 'Milk']);
    const [toast, setToast] = useState(null);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
    const [editingWeight, setEditingWeight] = useState(null);
    const [expandedMacros, setExpandedMacros] = useState(new Set());
    const [showQuickAddCustomize, setShowQuickAddCustomize] = useState(false);
    const [slowConnection, setSlowConnection] = useState(false);

    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const analysisTimerRef = useRef(null);
    const slowConnectionTimerRef = useRef(null);

    const styles = THEMES[theme];
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;

    // Get random placeholder
    const placeholder = useMemo(() =>
        PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)],
        []
    );

    // Get current hour for time-based suggestions
    const currentHour = new Date().getHours();
    const getTimeBasedMeal = () => {
        if (currentHour >= 6 && currentHour < 10) return 'Breakfast';
        if (currentHour >= 12 && currentHour < 14) return 'Lunch';
        if (currentHour >= 16 && currentHour < 18) return 'Snacks';
        if (currentHour >= 19 && currentHour < 22) return 'Dinner';
        return 'Snacks';
    };

    // Get quick add items for current meal
    const quickAddItems = useMemo(() => QUICK_ADD_BY_MEAL[activeMeal] || QUICK_ADD_BY_MEAL.Snacks, [activeMeal]);

    // Show first-time tooltip
    useEffect(() => {
        const hasSeenTooltip = localStorage.getItem('seenAILogTooltip');
        if (!hasSeenTooltip && mode === 'ai') {
            setShowTooltip(true);
            setTimeout(() => {
                setShowTooltip(false);
                localStorage.setItem('seenAILogTooltip', 'true');
            }, 3000);
        }
    }, [mode]);

    // Auto-capitalize first letter
    const handleQueryChange = (e) => {
        let value = e.target.value;
        if (value.length === 1) {
            value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        setQuery(value);
    };

    // AI Analysis with enhanced feedback
    const handleAISubmit = async () => {
        if (!query.trim()) return;
        setIsAnalyzing(true);
        setError('');
        setAiResult(null);
        setSlowConnection(false);

        // Progress steps simulation
        const steps = ['Reading description...', 'Identifying foods...', 'Calculating nutrition...'];
        let stepIndex = 0;
        analysisTimerRef.current = setInterval(() => {
            setAnalysisStep(steps[stepIndex]);
            stepIndex = (stepIndex + 1) % steps.length;
        }, 800);

        // Slow connection warning
        slowConnectionTimerRef.current = setTimeout(() => {
            setSlowConnection(true);
        }, 5000);

        let prompt = "";
        if (type === 'exercise') {
            prompt = `Estimate calories burned for this activity: "${query}". User Stats: Age ${userStats.age}, Weight ${userStats.weight}kg, Height ${userStats.height}cm. Return ONLY a valid JSON array with 2-3 variations. Example: [{"name": "Running (moderate)", "duration": "30 mins", "calories": 300, "confidence": 0.85}, {"name": "Running (intense)", "duration": "30 mins", "calories": 450, "confidence": 0.7}].`;
        } else {
            prompt = `Analyze this meal description: "${query}". Identify food items, estimate calories, protein (g), carbs (g), fat (g), and approximate weight. Provide 2-3 portion size variations when appropriate (small, medium, large or specific weights). Also suggest 2-3 alternative foods the user might have meant. Return ONLY a valid JSON object with this structure: {"suggestions": [{"name": "Food Name", "weight": "200g", "calories": 350, "protein": 15, "carbs": 40, "fat": 12, "confidence": 0.85}], "alternatives": ["Alternative 1", "Alternative 2"]}.`;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) throw new Error("No response");
            const text = data.candidates[0].content.parts[0].text;
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonString);

            if (type === 'exercise') {
                if (Array.isArray(parsed)) setAiResult({ suggestions: parsed, alternatives: [] });
            } else {
                if (parsed.suggestions) setAiResult(parsed);
                else if (Array.isArray(parsed)) setAiResult({ suggestions: parsed, alternatives: [] });
            }
        } catch (err) {
            console.error(err);
            // Provide helpful error messages
            if (query.match(/^\d*$/)) {
                setError("Please add quantity. Example: '2 rotis' instead of just '2'");
            } else if (query.length < 3) {
                setError("Please be more specific. Example: '1 medium apple' or '200g cooked rice'");
            } else {
                setError("Couldn't recognize that. Try being more specific: '1 medium apple' or '200g cooked rice'");
            }

            // Fallback demo data
            setTimeout(() => {
                if (type === 'exercise') {
                    setAiResult({
                        suggestions: [
                            { name: query + " (light)", duration: "30 mins", calories: 180, confidence: 0.6 },
                            { name: query + " (moderate)", duration: "30 mins", calories: 250, confidence: 0.7 },
                            { name: query + " (intense)", duration: "30 mins", calories: 350, confidence: 0.5 }
                        ],
                        alternatives: []
                    });
                } else {
                    setAiResult({
                        suggestions: [
                            { name: query, weight: "150g", calories: 280, protein: 12, carbs: 35, fat: 10, confidence: 0.75 },
                            { name: query + " (small)", weight: "100g", calories: 180, protein: 8, carbs: 23, fat: 6, confidence: 0.65 },
                            { name: query + " (large)", weight: "250g", calories: 460, protein: 20, carbs: 58, fat: 17, confidence: 0.6 }
                        ],
                        alternatives: ["Similar food 1", "Similar food 2", "Similar food 3"]
                    });
                }
                setError('');
            }, 800);
        } finally {
            clearInterval(analysisTimerRef.current);
            clearTimeout(slowConnectionTimerRef.current);
            setIsAnalyzing(false);
            setAnalysisStep('');
            setSlowConnection(false);
        }
    };

    // Handle food add with toast
    const handleAddFood = (item) => {
        setLastAddedItem({ item, meal: type === 'exercise' ? 'exercise' : activeMeal });
        onAdd(item, type === 'exercise' ? 'exercise' : activeMeal);
        setToast({ message: `${item.name} added to ${activeMeal} ✓`, type: 'success' });

        // Haptic feedback (if available)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    // Handle undo
    const handleUndo = () => {
        if (lastAddedItem) {
            // In a real app, you'd call an onRemove function here
            setToast({ message: `${lastAddedItem.item.name} removed`, type: 'error' });
            setLastAddedItem(null);
        }
    };

    // Voice input handler
    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Voice input not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;

        recognition.onstart = () => setIsVoiceListening(true);
        recognition.onend = () => {
            setIsVoiceListening(false);
            setIsVoiceProcessing(true);
            setTimeout(() => setIsVoiceProcessing(false), 500);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript.charAt(0).toUpperCase() + transcript.slice(1));
        };
        recognition.onerror = () => {
            setIsVoiceListening(false);
            setError('Could not capture voice. Please try again.');
        };

        recognition.start();
    };

    // Quick add from item
    const handleQuickAdd = (item) => {
        handleAddFood({
            name: item.name,
            weight: item.portion,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
        });
    };

    // Toggle macro expansion
    const toggleMacroExpansion = (index) => {
        const newExpanded = new Set(expandedMacros);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedMacros(newExpanded);
    };

    // Weight update handler
    const handleWeightUpdate = (index, newWeight) => {
        if (!aiResult) return;
        const updatedSuggestions = [...aiResult.suggestions];
        const item = updatedSuggestions[index];
        const originalWeight = parseInt(item.weight) || 200;
        const ratio = newWeight / originalWeight;

        updatedSuggestions[index] = {
            ...item,
            weight: `${newWeight}g`,
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio * 10) / 10,
            carbs: Math.round(item.carbs * ratio * 10) / 10,
            fat: Math.round(item.fat * ratio * 10) / 10
        };

        setAiResult({ ...aiResult, suggestions: updatedSuggestions });
    };

    // Search functionality
    const handleSearch = (searchTerm) => {
        // In a real app, this would call an API
        setSearchQuery(searchTerm);
        // Simulate search results
        if (searchTerm.length >= 2) {
            const allItems = Object.values(QUICK_ADD_BY_MEAL).flat();
            const filtered = allItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filtered.slice(0, 10));
        } else {
            setSearchResults([]);
        }
    };

    // Styles
    const modalBg = theme === 'dark' ? 'bg-[#000000]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-[#F2F2F7]');
    const headerBg = styles.card;
    const inputBg = theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-white';
    const cardBg = theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-white';

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col ${modalBg}`}>
            {/* Header - Fixed */}
            <div className={`px-6 pt-12 pb-4 shadow-sm z-10 ${headerBg} transition-colors shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-widest ${styles.textSec}`}>
                            {type === 'exercise' ? 'Log Activity' : (editingFood ? 'Edit Item' : 'Add Food')}
                        </span>
                        <h2 className={`text-2xl font-bold ${styles.textMain}`}>
                            {type === 'exercise' ? 'New Workout' : (editingFood ? 'Update Entry' : 'New Entry')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'} ${styles.textSec}`}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Meal Tabs */}
                {type !== 'exercise' && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {MEAL_OPTIONS.map(m => (
                            <button
                                key={m}
                                onClick={() => setActiveMeal(m)}
                                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${activeMeal === m
                                        ? (theme === 'dark' ? 'bg-white text-black' : (theme === 'wooden' ? 'bg-[#3E2723] text-[#EAD8B1]' : 'bg-black text-white'))
                                        : (theme === 'dark' ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-200 text-gray-500')
                                    }`}
                                aria-label={`Select ${m} meal`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4 pb-32">
                    {/* Recently Logged Section */}
                    {type !== 'exercise' && recentFoods.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-xs font-bold ${styles.textSec} uppercase tracking-widest flex items-center gap-2`}>
                                    <Clock size={12} /> Recently Logged
                                </h3>
                                <select className={`text-xs rounded-lg px-2 py-1 ${inputBg} ${styles.textSec} border ${styles.border}`}>
                                    <option>Today</option>
                                    <option>This Week</option>
                                </select>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {recentFoods.slice(0, 8).map((food, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddFood(food)}
                                        className={`flex-shrink-0 p-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 ${cardBg} ${styles.border}`}
                                        style={{ minWidth: '140px' }}
                                    >
                                        <p className={`font-bold text-sm truncate ${styles.textMain}`}>{food.name}</p>
                                        <p className={`text-xs ${styles.textSec} mt-1`}>{food.portion || food.weight}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}`}>
                                                {food.calories} kcal
                                            </span>
                                            <Plus size={14} className={styles.accentBlueText} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Smart Suggestion Banner */}
                    {type !== 'exercise' && foodPatterns?.suggestion && (
                        <div className={`mb-6 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-purple-500/30' : 'bg-indigo-100'}`}>
                                    <Zap size={18} className={theme === 'dark' ? 'text-purple-400' : 'text-indigo-600'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${styles.textMain}`}>{foodPatterns.suggestion}</p>
                                </div>
                                <button className={`px-3 py-1.5 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-purple-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                    + Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Log Section (Primary) */}
                    <div className="mb-6">
                        {/* First-time tooltip */}
                        {showTooltip && (
                            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 animate-fade-in ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                <Sparkles size={16} />
                                <span className="text-sm font-medium">Describe your meal in plain language ✨</span>
                            </div>
                        )}

                        <div className={`p-6 rounded-[2rem] shadow-sm relative overflow-hidden transition-colors border ${styles.card} ${styles.border}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={100} className={styles.textMain} />
                            </div>

                            <label className={`block text-sm font-bold mb-2 ${styles.textSec}`}>
                                {type === 'exercise' ? 'Describe your workout' : 'Describe your meal'}
                            </label>

                            <div className="relative">
                                <textarea
                                    ref={inputRef}
                                    className={`w-full text-lg placeholder:text-gray-400 outline-none resize-none bg-transparent ${styles.textMain} ${isAnalyzing ? 'opacity-50' : ''}`}
                                    rows={3}
                                    placeholder={type === 'exercise' ? "e.g. 30 mins jogging at moderate pace..." : placeholder}
                                    value={query}
                                    onChange={handleQueryChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAISubmit();
                                        }
                                    }}
                                    disabled={isAnalyzing}
                                    maxLength={200}
                                    aria-label="Meal description input"
                                />

                                {/* Character counter */}
                                <span className={`absolute bottom-0 right-0 text-xs ${styles.textSec}`}>
                                    {query.length}/200
                                </span>
                            </div>

                            {/* Voice indicator */}
                            <VoiceRecordingIndicator isListening={isVoiceListening} isProcessing={isVoiceProcessing} theme={theme} />

                            <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleVoiceInput}
                                        disabled={isAnalyzing}
                                        className={`p-2 rounded-full transition-all ${isVoiceListening
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : `${styles.textSec} hover:opacity-80`
                                            }`}
                                        title="Tap and say your meal naturally"
                                        aria-label="Voice input"
                                    >
                                        <Mic size={20} />
                                    </button>

                                    {/* Voice tip */}
                                    {!isVoiceListening && (
                                        <span className={`text-xs ${styles.textSec} hidden sm:block`}>
                                            Try: Tap and say your meal
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={handleAISubmit}
                                    disabled={!query || isAnalyzing}
                                    className={`px-6 py-3 rounded-full font-bold text-white transition-all flex items-center gap-2 ${!query
                                            ? 'bg-gray-400'
                                            : isAnalyzing
                                                ? (theme === 'dark' ? 'bg-[#0A84FF] animate-pulse' : 'bg-black animate-pulse')
                                                : (theme === 'dark' ? 'bg-[#0A84FF]' : (theme === 'wooden' ? 'bg-[#8B4513]' : 'bg-black'))
                                        }`}
                                    aria-label="Analyze meal"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            Analyzing... 🔍
                                        </>
                                    ) : (
                                        <>
                                            Analyze <ArrowRight size={18} strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Analysis progress */}
                            {isAnalyzing && (
                                <div className={`mt-4 pt-4 border-t ${styles.border}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[...Array(3)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'}`}
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                />
                                            ))}
                                        </div>
                                        <span className={`text-sm ${styles.textSec}`}>{analysisStep}</span>
                                    </div>
                                    {slowConnection && (
                                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                                            Taking longer than usual... Still working
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Search database link */}
                        {type !== 'exercise' && (
                            <button
                                onClick={() => setShowSearchOverlay(true)}
                                className={`mt-3 text-sm font-medium w-full text-center py-2 ${styles.accentBlueText} hover:underline flex items-center justify-center gap-1`}
                            >
                                <Search size={14} /> or search food database →
                            </button>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">
                            <p className="text-sm mb-3">{error}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setQuery('')}
                                    className="px-3 py-1.5 bg-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors"
                                >
                                    Add Quantity
                                </button>
                                <button
                                    onClick={() => { setShowSearchOverlay(true); setError(''); }}
                                    className="px-3 py-1.5 bg-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors"
                                >
                                    Try Search Instead
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Suggestions (Loading State) */}
                    {isAnalyzing && (
                        <div className="mb-6 space-y-3">
                            <h3 className={`text-sm font-bold ${styles.textSec} uppercase tracking-widest ml-1`}>AI Suggestions</h3>
                            <SkeletonCard theme={theme} />
                            <SkeletonCard theme={theme} />
                            <SkeletonCard theme={theme} />
                        </div>
                    )}

                    {/* AI Suggestions (Results) */}
                    {aiResult && !isAnalyzing && (
                        <div className="animate-fade-in mb-6 space-y-3">
                            <h3 className={`text-sm font-bold ${styles.textSec} uppercase tracking-widest ml-1 flex items-center gap-2`}>
                                <Sparkles size={14} /> AI Suggestions
                            </h3>

                            {aiResult.suggestions.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl shadow-sm border transition-all relative overflow-hidden ${cardBg} ${styles.border}`}
                                >
                                    {/* Weight Editor Overlay */}
                                    {editingWeight === idx && (
                                        <WeightEditor
                                            value={item.weight}
                                            onChange={(newWeight) => handleWeightUpdate(idx, newWeight)}
                                            onClose={() => setEditingWeight(null)}
                                            theme={theme}
                                        />
                                    )}

                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`font-bold ${styles.textMain}`}>{item.name}</p>
                                                {item.confidence && <ConfidenceIndicator score={item.confidence} theme={theme} />}
                                            </div>

                                            <div className={`flex items-center gap-3 text-sm ${styles.textSec}`}>
                                                {type === 'exercise' ? (
                                                    <span className="text-blue-500 font-medium">{item.duration}</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingWeight(idx)}
                                                        className={`font-bold ${styles.accentBlueText} hover:underline flex items-center gap-1`}
                                                    >
                                                        {item.weight} <Edit2 size={12} />
                                                    </button>
                                                )}
                                                <span className={theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}>
                                                    {item.calories} {type === 'exercise' ? 'burned' : 'kcal'}
                                                </span>
                                            </div>

                                            {/* Expandable Macros */}
                                            {type !== 'exercise' && (
                                                <button
                                                    onClick={() => toggleMacroExpansion(idx)}
                                                    className={`mt-2 text-xs flex items-center gap-1 ${styles.textSec} hover:opacity-80`}
                                                >
                                                    <ChevronDown size={14} className={`transform transition-transform ${expandedMacros.has(idx) ? 'rotate-180' : ''}`} />
                                                    {expandedMacros.has(idx) ? 'Hide' : 'Show'} macros
                                                </button>
                                            )}

                                            {expandedMacros.has(idx) && type !== 'exercise' && (
                                                <div className="mt-3 space-y-2 animate-fade-in">
                                                    <MacroBar label="Protein" value={item.protein} max={50} color="bg-blue-500" theme={theme} />
                                                    <MacroBar label="Carbs" value={item.carbs} max={100} color="bg-green-500" theme={theme} />
                                                    <MacroBar label="Fat" value={item.fat} max={50} color="bg-orange-500" theme={theme} />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAddFood(item)}
                                            className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-indigo-50'} ${styles.accentBlueText}`}
                                            aria-label={`Add ${item.name}`}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Alternative suggestions */}
                            {aiResult.alternatives && aiResult.alternatives.length > 0 && (
                                <div className={`mt-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-gray-50'}`}>
                                    <p className={`text-xs ${styles.textSec} mb-2`}>Not quite right? Try:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aiResult.alternatives.map((alt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setQuery(alt); setAiResult(null); }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-white text-gray-700'} border ${styles.border} hover:opacity-80 transition-colors`}
                                            >
                                                {alt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Add Section */}
                    {type !== 'exercise' && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-xs font-bold ${styles.textSec} uppercase tracking-widest`}>Quick Add</h3>
                                <button
                                    onClick={() => setShowQuickAddCustomize(true)}
                                    className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'} ${styles.textSec}`}
                                    aria-label="Customize quick add"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>

                            {/* 2-Column Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {quickAddItems.slice(0, 8).map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickAdd(item)}
                                        className={`p-3 rounded-xl text-left border transition-all hover:scale-[1.02] active:scale-95 ${cardBg} ${styles.border}`}
                                        title={`~${item.calories} kcal`}
                                    >
                                        <p className={`font-bold text-sm truncate ${styles.textMain}`}>{item.name}</p>
                                        <p className={`text-xs ${styles.textSec} truncate`}>{item.portion}</p>
                                        <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}`}>
                                            ~{item.calories} kcal
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {quickAddItems.length > 8 && (
                                <button className={`w-full mt-3 py-2 text-sm font-medium ${styles.accentBlueText}`}>
                                    Show more ({quickAddItems.length - 8} items)
                                </button>
                            )}
                        </div>
                    )}

                    {/* Barcode Scanner FAB */}
                    {type !== 'exercise' && (
                        <button
                            className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-[#0A84FF] text-white' : (theme === 'wooden' ? 'bg-[#8B4513] text-white' : 'bg-black text-white')}`}
                            aria-label="Scan barcode"
                        >
                            <ScanLine size={20} />
                            <span className="font-semibold">Scan</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search Overlay (Modal) */}
            {showSearchOverlay && (
                <div className={`fixed inset-0 z-[70] flex flex-col ${modalBg} animate-slide-up`}>
                    <div className={`px-6 pt-12 pb-4 ${headerBg}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <button onClick={() => setShowSearchOverlay(false)} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
                                <X size={20} className={styles.textSec} />
                            </button>
                            <h2 className={`text-xl font-bold ${styles.textMain}`}>Search Foods</h2>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search database..."
                                className={`w-full py-3.5 pl-12 pr-4 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-lg ${inputBg} ${styles.textMain}`}
                                autoFocus
                            />
                            <button onClick={handleVoiceInput} className={`absolute right-4 top-3 p-1 ${styles.textSec}`}>
                                <Mic size={20} />
                            </button>
                        </div>

                        {/* Recent Searches */}
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                            {recentSearches.map((term, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSearch(term)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Search Results */}
                        {searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { handleQuickAdd(item); setShowSearchOverlay(false); }}
                                        className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${cardBg} ${styles.border} border transition-colors hover:opacity-90`}
                                    >
                                        <div>
                                            <p className={`font-bold ${styles.textMain}`}>{item.name}</p>
                                            <p className={`text-sm ${styles.textSec}`}>{item.portion}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${theme === 'dark' ? 'text-green-400' : 'text-emerald-600'}`}>{item.calories} kcal</p>
                                            <Plus size={16} className={styles.accentBlueText} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchQuery.length > 0 ? (
                            <div className={`text-center py-12 ${styles.textSec}`}>
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No results found</p>
                                <p className="text-sm mt-2">Not in database? Use AI Log to add custom foods</p>
                            </div>
                        ) : (
                            /* Category Browse */
                            <div>
                                <h3 className={`text-xs font-bold ${styles.textSec} uppercase tracking-widest mb-3`}>Browse by Category</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {FOOD_CATEGORIES.map((cat, idx) => (
                                        <button
                                            key={idx}
                                            className={`p-4 rounded-2xl text-left ${cardBg} ${styles.border} border transition-colors hover:opacity-90`}
                                        >
                                            <span className="text-2xl mb-2 block">{cat.icon}</span>
                                            <p className={`font-bold ${styles.textMain}`}>{cat.name}</p>
                                            <p className={`text-xs ${styles.textSec}`}>{cat.items} items</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onUndo={toast.type === 'success' ? handleUndo : null}
                    onDismiss={() => setToast(null)}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default AddFoodView;
