import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Mic, ArrowRight, Plus, Search, ScanLine, Edit2, Clock, ChevronDown, Undo2, Check, AlertCircle, HelpCircle, Zap, Star, Filter, TrendingUp, Loader2, Heart } from 'lucide-react';
import { THEMES } from '../theme';
import { db } from '../firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getLocalDateStr } from '../utils';

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
        { name: "Tea", icon: "🍵", portion: "1 cup, 200ml", calories: 45, protein: 1, carbs: 6, fat: 1.5 },
        { name: "Coffee", icon: "☕", portion: "1 cup, 200ml", calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: "Milk", icon: "🥛", portion: "1 glass, 250ml", calories: 150, protein: 8, carbs: 12, fat: 8 },
        { name: "Boiled Egg", icon: "🥚", portion: "1 large", calories: 78, protein: 6, carbs: 0.5, fat: 5 },
        { name: "Banana", icon: "🍌", portion: "1 medium, 120g", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: "Apple", icon: "🍎", portion: "1 medium, 180g", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: "Bread Toast", icon: "🍞", portion: "2 slices", calories: 160, protein: 5, carbs: 30, fat: 2.5 },
        { name: "Omelette", icon: "🍳", portion: "2 eggs", calories: 180, protein: 12, carbs: 2, fat: 14 },
        { name: "Paratha", icon: "🫓", portion: "1 medium, 60g", calories: 180, protein: 4, carbs: 25, fat: 7 },
        { name: "Upma", icon: "🥣", portion: "1 bowl, 150g", calories: 220, protein: 6, carbs: 35, fat: 7 },
        { name: "Poha", icon: "🍛", portion: "1 bowl, 150g", calories: 200, protein: 4, carbs: 38, fat: 5 },
        { name: "Idli", icon: "🫕", portion: "2 pieces", calories: 120, protein: 4, carbs: 24, fat: 0.5 }
    ],
    Lunch: [
        { name: "Cooked Rice", icon: "🍚", portion: "1 bowl, 150g", calories: 195, protein: 4, carbs: 45, fat: 0.4 },
        { name: "Roti", icon: "🫓", portion: "1 medium, 40g", calories: 120, protein: 3, carbs: 25, fat: 1 },
        { name: "Dal", icon: "🥘", portion: "1 bowl, 150g", calories: 150, protein: 9, carbs: 20, fat: 3 },
        { name: "Chicken Curry", icon: "🍗", portion: "150g", calories: 280, protein: 25, carbs: 8, fat: 18 },
        { name: "Paneer", icon: "🧀", portion: "100g", calories: 265, protein: 18, carbs: 3, fat: 20 },
        { name: "Curd", icon: "🥄", portion: "1 bowl, 100g", calories: 60, protein: 3, carbs: 5, fat: 3 },
        { name: "Sabzi", icon: "🥬", portion: "1 bowl, 150g", calories: 120, protein: 4, carbs: 12, fat: 6 },
        { name: "Raita", icon: "🥣", portion: "1 bowl, 100g", calories: 70, protein: 3, carbs: 6, fat: 3 },
        { name: "Biryani", icon: "🍛", portion: "1 plate, 250g", calories: 450, protein: 20, carbs: 55, fat: 18 },
        { name: "Rajma", icon: "🫘", portion: "1 bowl, 150g", calories: 180, protein: 10, carbs: 28, fat: 4 },
        { name: "Fish Curry", icon: "🐟", portion: "150g", calories: 200, protein: 22, carbs: 6, fat: 10 },
        { name: "Salad", icon: "🥗", portion: "1 bowl, 100g", calories: 35, protein: 1, carbs: 7, fat: 0.3 }
    ],
    Dinner: [
        { name: "Cooked Rice", icon: "🍚", portion: "1 bowl, 150g", calories: 195, protein: 4, carbs: 45, fat: 0.4 },
        { name: "Roti", icon: "🫓", portion: "1 medium, 40g", calories: 120, protein: 3, carbs: 25, fat: 1 },
        { name: "Dal", icon: "🥘", portion: "1 bowl, 150g", calories: 150, protein: 9, carbs: 20, fat: 3 },
        { name: "Chicken Curry", icon: "🍗", portion: "150g", calories: 280, protein: 25, carbs: 8, fat: 18 },
        { name: "Paneer", icon: "🧀", portion: "100g", calories: 265, protein: 18, carbs: 3, fat: 20 },
        { name: "Curd", icon: "🥄", portion: "1 bowl, 100g", calories: 60, protein: 3, carbs: 5, fat: 3 },
        { name: "Dosa", icon: "🥞", portion: "1 large", calories: 168, protein: 4, carbs: 28, fat: 5 },
        { name: "Khichdi", icon: "🍲", portion: "1 bowl, 200g", calories: 250, protein: 8, carbs: 40, fat: 6 },
        { name: "Soup", icon: "🍜", portion: "1 bowl, 200ml", calories: 80, protein: 3, carbs: 8, fat: 4 },
        { name: "Chapati", icon: "🫓", portion: "2 medium", calories: 240, protein: 6, carbs: 50, fat: 2 },
        { name: "Aloo Gobi", icon: "🥔", portion: "1 bowl, 150g", calories: 140, protein: 3, carbs: 18, fat: 6 },
        { name: "Palak Paneer", icon: "🥬", portion: "150g", calories: 280, protein: 14, carbs: 10, fat: 22 }
    ],
    Snacks: [
        { name: "Tea", icon: "🍵", portion: "1 cup, 200ml", calories: 45, protein: 1, carbs: 6, fat: 1.5 },
        { name: "Coffee", icon: "☕", portion: "1 cup, 200ml", calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: "Banana", icon: "🍌", portion: "1 medium, 120g", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: "Apple", icon: "🍎", portion: "1 medium, 180g", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: "Biscuits", icon: "🍪", portion: "4 pieces", calories: 120, protein: 2, carbs: 20, fat: 4 },
        { name: "Namkeen", icon: "🥜", portion: "50g", calories: 260, protein: 5, carbs: 30, fat: 14 },
        { name: "Samosa", icon: "🔺", portion: "1 piece", calories: 250, protein: 5, carbs: 28, fat: 14 },
        { name: "Pakora", icon: "🧆", portion: "4 pieces", calories: 200, protein: 4, carbs: 18, fat: 12 },
        { name: "Bhel Puri", icon: "🥙", portion: "1 plate", calories: 180, protein: 4, carbs: 32, fat: 6 },
        { name: "Vada Pav", icon: "🍔", portion: "1 piece", calories: 290, protein: 6, carbs: 35, fat: 14 },
        { name: "Sandwich", icon: "🥪", portion: "1 piece", calories: 200, protein: 7, carbs: 28, fat: 8 },
        { name: "Fruit Chaat", icon: "🍓", portion: "1 bowl, 150g", calories: 100, protein: 1, carbs: 24, fat: 0.5 }
    ]
};

// Food categories with items for browse
const FOOD_BY_CATEGORY = {
    Vegetables: [
        { name: "Spinach", icon: "🥬", portion: "1 bowl, 100g", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
        { name: "Potato", icon: "🥔", portion: "1 medium, 150g", calories: 130, protein: 3, carbs: 30, fat: 0.2 },
        { name: "Tomato", icon: "🍅", portion: "1 medium, 120g", calories: 22, protein: 1, carbs: 4.8, fat: 0.2 },
        { name: "Onion", icon: "🧅", portion: "1 medium, 100g", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
        { name: "Carrot", icon: "🥕", portion: "1 medium, 80g", calories: 33, protein: 0.7, carbs: 7.7, fat: 0.2 },
        { name: "Broccoli", icon: "🥦", portion: "1 cup, 90g", calories: 31, protein: 2.5, carbs: 6, fat: 0.4 },
        { name: "Capsicum", icon: "🫑", portion: "1 medium, 120g", calories: 30, protein: 1, carbs: 7, fat: 0.2 },
        { name: "Cauliflower", icon: "🥦", portion: "1 cup, 100g", calories: 25, protein: 2, carbs: 5, fat: 0.3 },
        { name: "Cabbage", icon: "🥬", portion: "1 cup, 90g", calories: 22, protein: 1.3, carbs: 5.2, fat: 0.1 },
        { name: "Lady Finger", icon: "🌿", portion: "1 bowl, 100g", calories: 33, protein: 1.9, carbs: 7, fat: 0.2 }
    ],
    Fruits: [
        { name: "Banana", icon: "🍌", portion: "1 medium, 120g", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: "Apple", icon: "🍎", portion: "1 medium, 180g", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: "Mango", icon: "🥭", portion: "1 medium, 200g", calories: 135, protein: 1.4, carbs: 35, fat: 0.6 },
        { name: "Orange", icon: "🍊", portion: "1 medium, 150g", calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
        { name: "Grapes", icon: "🍇", portion: "1 cup, 150g", calories: 104, protein: 1, carbs: 27, fat: 0.2 },
        { name: "Watermelon", icon: "🍉", portion: "1 cup, 150g", calories: 46, protein: 0.9, carbs: 11.5, fat: 0.2 },
        { name: "Papaya", icon: "🍈", portion: "1 cup, 140g", calories: 55, protein: 0.9, carbs: 14, fat: 0.1 },
        { name: "Guava", icon: "🍐", portion: "1 medium, 100g", calories: 68, protein: 2.6, carbs: 14, fat: 1 },
        { name: "Pomegranate", icon: "🫐", portion: "1/2 cup seeds, 90g", calories: 72, protein: 1.5, carbs: 16, fat: 1 },
        { name: "Pineapple", icon: "🍍", portion: "1 cup, 165g", calories: 82, protein: 0.9, carbs: 22, fat: 0.2 }
    ],
    Grains: [
        { name: "Cooked Rice", icon: "🍚", portion: "1 bowl, 150g", calories: 195, protein: 4, carbs: 45, fat: 0.4 },
        { name: "Roti", icon: "🫓", portion: "1 medium, 40g", calories: 120, protein: 3, carbs: 25, fat: 1 },
        { name: "Bread", icon: "🍞", portion: "2 slices, 60g", calories: 160, protein: 5, carbs: 30, fat: 2.5 },
        { name: "Oats", icon: "🥣", portion: "1 bowl, 40g", calories: 150, protein: 5, carbs: 27, fat: 2.5 },
        { name: "Poha", icon: "🍛", portion: "1 bowl, 150g", calories: 200, protein: 4, carbs: 38, fat: 5 },
        { name: "Upma", icon: "🥣", portion: "1 bowl, 150g", calories: 220, protein: 6, carbs: 35, fat: 7 },
        { name: "Dosa", icon: "🥞", portion: "1 large", calories: 168, protein: 4, carbs: 28, fat: 5 },
        { name: "Idli", icon: "🫕", portion: "2 pieces", calories: 120, protein: 4, carbs: 24, fat: 0.5 },
        { name: "Pasta", icon: "🍝", portion: "1 bowl, 200g", calories: 280, protein: 10, carbs: 55, fat: 3 },
        { name: "Noodles", icon: "🍜", portion: "1 bowl, 200g", calories: 310, protein: 8, carbs: 48, fat: 10 }
    ],
    Proteins: [
        { name: "Chicken Breast", icon: "🍗", portion: "100g grilled", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        { name: "Boiled Egg", icon: "🥚", portion: "1 large", calories: 78, protein: 6, carbs: 0.5, fat: 5 },
        { name: "Paneer", icon: "🧀", portion: "100g", calories: 265, protein: 18, carbs: 3, fat: 20 },
        { name: "Dal", icon: "🥘", portion: "1 bowl, 150g", calories: 150, protein: 9, carbs: 20, fat: 3 },
        { name: "Fish", icon: "🐟", portion: "100g", calories: 136, protein: 20, carbs: 0, fat: 6 },
        { name: "Rajma", icon: "🫘", portion: "1 bowl, 150g", calories: 180, protein: 10, carbs: 28, fat: 4 },
        { name: "Chana", icon: "🫘", portion: "1 bowl, 150g", calories: 210, protein: 12, carbs: 35, fat: 4 },
        { name: "Tofu", icon: "🧊", portion: "100g", calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
        { name: "Mutton Curry", icon: "🍖", portion: "150g", calories: 320, protein: 25, carbs: 5, fat: 22 },
        { name: "Prawns", icon: "🦐", portion: "100g", calories: 99, protein: 24, carbs: 0.2, fat: 0.3 }
    ],
    Dairy: [
        { name: "Milk", icon: "🥛", portion: "1 glass, 250ml", calories: 150, protein: 8, carbs: 12, fat: 8 },
        { name: "Curd", icon: "🥄", portion: "1 bowl, 100g", calories: 60, protein: 3, carbs: 5, fat: 3 },
        { name: "Buttermilk", icon: "🥛", portion: "1 glass, 200ml", calories: 40, protein: 3, carbs: 5, fat: 1 },
        { name: "Cheese", icon: "🧀", portion: "1 slice, 20g", calories: 68, protein: 4, carbs: 0.4, fat: 5.5 },
        { name: "Ghee", icon: "🫕", portion: "1 tbsp, 15g", calories: 130, protein: 0, carbs: 0, fat: 15 },
        { name: "Butter", icon: "🧈", portion: "1 tbsp, 14g", calories: 100, protein: 0.1, carbs: 0, fat: 11 },
        { name: "Raita", icon: "🥣", portion: "1 bowl, 100g", calories: 70, protein: 3, carbs: 6, fat: 3 },
        { name: "Lassi", icon: "🥛", portion: "1 glass, 250ml", calories: 180, protein: 6, carbs: 28, fat: 5 }
    ],
    Beverages: [
        { name: "Tea", icon: "🍵", portion: "1 cup, 200ml", calories: 45, protein: 1, carbs: 6, fat: 1.5 },
        { name: "Coffee", icon: "☕", portion: "1 cup, 200ml", calories: 5, protein: 0.3, carbs: 0, fat: 0 },
        { name: "Green Tea", icon: "🍵", portion: "1 cup, 200ml", calories: 2, protein: 0, carbs: 0, fat: 0 },
        { name: "Fresh Juice", icon: "🧃", portion: "1 glass, 200ml", calories: 110, protein: 1, carbs: 26, fat: 0.3 },
        { name: "Coconut Water", icon: "🥥", portion: "1 glass, 250ml", calories: 48, protein: 2, carbs: 9, fat: 0.5 },
        { name: "Lemonade", icon: "🍋", portion: "1 glass, 250ml", calories: 80, protein: 0.3, carbs: 21, fat: 0 },
        { name: "Protein Shake", icon: "🥤", portion: "1 scoop, 300ml", calories: 120, protein: 24, carbs: 3, fat: 1 },
        { name: "Soft Drink", icon: "🥤", portion: "1 can, 330ml", calories: 140, protein: 0, carbs: 39, fat: 0 }
    ],
    Snacks: [
        { name: "Samosa", icon: "🔺", portion: "1 piece", calories: 250, protein: 5, carbs: 28, fat: 14 },
        { name: "Pakora", icon: "🧆", portion: "4 pieces", calories: 200, protein: 4, carbs: 18, fat: 12 },
        { name: "Biscuits", icon: "🍪", portion: "4 pieces", calories: 120, protein: 2, carbs: 20, fat: 4 },
        { name: "Namkeen", icon: "🥜", portion: "50g", calories: 260, protein: 5, carbs: 30, fat: 14 },
        { name: "Bhel Puri", icon: "🥙", portion: "1 plate", calories: 180, protein: 4, carbs: 32, fat: 6 },
        { name: "Sandwich", icon: "🥪", portion: "1 piece", calories: 200, protein: 7, carbs: 28, fat: 8 },
        { name: "Almonds", icon: "🌰", portion: "10 pieces, 15g", calories: 85, protein: 3, carbs: 3, fat: 7 },
        { name: "Makhana", icon: "🫘", portion: "1 bowl, 30g", calories: 100, protein: 3, carbs: 18, fat: 0.5 },
        { name: "Sprouts", icon: "🌱", portion: "1 bowl, 100g", calories: 80, protein: 6, carbs: 12, fat: 0.5 },
        { name: "Fruit Chaat", icon: "🍓", portion: "1 bowl, 150g", calories: 100, protein: 1, carbs: 24, fat: 0.5 }
    ],
    "Fast Food": [
        { name: "Vada Pav", icon: "🍔", portion: "1 piece", calories: 290, protein: 6, carbs: 35, fat: 14 },
        { name: "Pav Bhaji", icon: "🍛", portion: "1 plate", calories: 400, protein: 10, carbs: 52, fat: 18 },
        { name: "Pizza Slice", icon: "🍕", portion: "1 slice, 100g", calories: 270, protein: 12, carbs: 33, fat: 10 },
        { name: "Burger", icon: "🍔", portion: "1 regular", calories: 350, protein: 15, carbs: 40, fat: 15 },
        { name: "French Fries", icon: "🍟", portion: "medium, 120g", calories: 365, protein: 4, carbs: 44, fat: 19 },
        { name: "Chole Bhature", icon: "🫓", portion: "1 plate", calories: 500, protein: 14, carbs: 60, fat: 24 },
        { name: "Frankie/Wrap", icon: "🌯", portion: "1 piece", calories: 320, protein: 12, carbs: 38, fat: 14 },
        { name: "Momos", icon: "🥟", portion: "6 pieces", calories: 240, protein: 10, carbs: 30, fat: 9 }
    ]
};

const FOOD_CATEGORIES = Object.keys(FOOD_BY_CATEGORY).map(name => ({
    name,
    icon: FOOD_BY_CATEGORY[name][0]?.icon || '🍽️',
    items: FOOD_BY_CATEGORY[name].length
}));

const MEAL_TAB_CONFIG = {
    Breakfast: { emoji: '🌅', bg: 'rgba(251,191,36,0.18)', color: '#fcd34d', border: 'rgba(251,191,36,0.4)' },
    Lunch:     { emoji: '🥗', bg: 'rgba(52,211,153,0.18)', color: '#6ee7b7', border: 'rgba(52,211,153,0.4)' },
    Dinner:    { emoji: '🌙', bg: 'rgba(99,102,241,0.18)', color: '#c4b5fd', border: 'rgba(99,102,241,0.4)' },
    Snacks:    { emoji: '🍎', bg: 'rgba(236,72,153,0.18)', color: '#f9a8d4', border: 'rgba(236,72,153,0.4)' },
};

// Change #9: Smart meal suggestions
const mealSuggestions = {
    Breakfast: ["2 boiled eggs + toast", "1 bowl oats with banana", "Poha with chai", "2 idli + sambar", "Paratha with curd", "Upma with coconut chutney"],
    Lunch: ["2 roti + dal fry + sabzi", "Rice + rajma + salad", "Chicken biryani 250g", "Curd rice + pickle", "Paneer butter masala + naan", "Fish curry + rice"],
    Dinner: ["2 chapati + paneer curry", "Dal rice + papad", "Grilled fish + veggies", "Khichdi + pickle", "Soup + bread", "Dosa + sambar"],
    Snacks: ["1 banana + peanut butter", "Handful of almonds", "Sprouts chaat 1 bowl", "Tea + 2 biscuits", "Fruit salad", "Roasted chana 50g"]
};

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

// Confidence indicator component — only show warnings for genuinely low confidence
const ConfidenceIndicator = ({ score, theme }) => {
    if (score >= 0.75) {
        return null; // High confidence — no badge needed
    } else if (score >= 0.5) {
        return <span className="flex items-center gap-1 text-xs text-amber-500 font-medium"><AlertCircle size={12} /> Approximate</span>;
    } else {
        return <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><HelpCircle size={12} /> Estimate only</span>;
    }
};

// Macro progress bar
const MacroBar = ({ label, value, max, color, theme }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className={`w-12 font-medium ${theme === 'dark' ? 'text-[#b0b8c8]' : 'text-gray-500'}`}>{label}</span>
        <div className={`flex-1 h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-200'}`}>
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
        </div>
        <span className={`w-8 text-right font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{value}g</span>
    </div>
);

// Weight slider editor — rendered as a bottom sheet overlay
const WeightEditor = ({ value, onChange, onClose, theme }) => {
    const [weight, setWeight] = useState(parseInt(value) || 200);
    const quickWeights = [50, 100, 150, 200, 300, 500];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose} />
            {/* Bottom Sheet */}
            <div className={`fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl p-6 pb-8 animate-slide-up md:max-w-md md:left-1/2 md:-translate-x-1/2 ${theme === 'dark' ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
                {/* Handle bar */}
                <div className="flex justify-center mb-4">
                    <div className={`w-10 h-1 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C]' : 'bg-gray-300'}`} />
                </div>
                <div className="flex justify-between items-center mb-5">
                    <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Adjust Weight</span>
                    <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3C] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <X size={18} />
                    </button>
                </div>
                {/* Current value */}
                <div className="flex justify-center mb-4">
                    <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weight}<span className="text-lg opacity-50">g</span></span>
                </div>
                {/* Slider */}
                <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full accent-blue-500 mb-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs mb-5">
                    <span className={theme === 'dark' ? 'text-[#9aa3b2]' : 'text-gray-400'}>10g</span>
                    <span className={theme === 'dark' ? 'text-[#9aa3b2]' : 'text-gray-400'}>1000g</span>
                </div>
                {/* Quick weight buttons */}
                <div className="flex gap-2 mb-6">
                    {quickWeights.map(w => (
                        <button key={w} onClick={() => setWeight(w)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${weight === w ? (theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-black text-white') : (theme === 'dark' ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-gray-700')}`}>
                            {w}g
                        </button>
                    ))}
                </div>
                {/* Apply button */}
                <button onClick={() => { onChange(weight); onClose(); }} className={`w-full py-4 rounded-2xl font-bold text-white text-base ${theme === 'dark' ? 'bg-blue-500 active:bg-blue-600' : 'bg-black active:bg-gray-800'} transition-colors`}>
                    Apply Weight
                </button>
            </div>
        </>
    );
};

// Change #3: Time-aware meal auto-selection (centralized in config.js)
import { getTimeBasedMeal } from '../config';

// ==========================================
// MAIN COMPONENT
// ==========================================

const AddFoodView = ({ meal, type, user, userStats, onClose, onAdd, theme, initialTerm, editingFood, recentFoods = [], foodPatterns = {} }) => {
    // Debug logging on mount / prop changes
    useEffect(() => {
        console.log('[AddFoodView] Mounted. Props -> meal:', meal, 'type:', type, 'editingFood:', editingFood?.name || null, 'recentFoods count:', recentFoods.length, 'foodPatterns:', Object.keys(foodPatterns));
    }, []);

    useEffect(() => {
        console.log('[AddFoodView] recentFoods updated. Count:', recentFoods.length, 'Items:', recentFoods.map(f => f.name));
    }, [recentFoods]);

    useEffect(() => {
        console.log('[AddFoodView] user prop changed. User exists:', !!user, 'UID:', user?.uid);
    }, [user]);

    // Change #3: Auto-select meal tab based on time
    const autoMeal = useMemo(() => getTimeBasedMeal(), []);
    const [activeMeal, setActiveMeal] = useState(meal || autoMeal);
    const [mealAutoSelected, setMealAutoSelected] = useState(!meal); // true if we auto-selected
    const [mode, setMode] = useState(type === 'exercise' || initialTerm ? 'ai' : 'ai');
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
    const [slowConnection, setSlowConnection] = useState(false);
    // Change #9: Sparkle suggestions popover
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [lastSuggestionSet, setLastSuggestionSet] = useState([]);
    // Change #5: Scan tooltip
    const [showScanPulse, setShowScanPulse] = useState(false);
    // Category browse state
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Frequent foods from last 30 days
    const [frequentFoods, setFrequentFoods] = useState([]);
    const [loadingFrequent, setLoadingFrequent] = useState(true);
    const [inputFocused, setInputFocused] = useState(false);

    // Initialize with editing food data
    useEffect(() => {
        if (editingFood) {
            setQuery(editingFood.name);
            setAiResult({
                suggestions: [{
                    ...editingFood,
                    confidence: 1.0
                }],
                alternatives: []
            });
        }
    }, [editingFood]);

    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const analysisTimerRef = useRef(null);
    const slowConnectionTimerRef = useRef(null);
    const suggestionsRef = useRef(null);

    const styles = THEMES[theme];
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
    useEffect(() => {
        console.log('[AddFoodView] AI API Key available:', !!apiKey, 'Source:', import.meta.env.VITE_GEMINI_API_KEY ? 'VITE_GEMINI_API_KEY' : (import.meta.env.VITE_FIREBASE_API_KEY ? 'VITE_FIREBASE_API_KEY (fallback)' : 'NONE'));
    }, [apiKey]);

    // Get random placeholder
    const placeholder = useMemo(() =>
        PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)],
        []
    );

    // Change #6: Get recent items from localStorage or fall back to defaults
    const { quickAddItems, isUsingRecent } = useMemo(() => {
        try {
            const stored = localStorage.getItem('recentMeals');
            if (stored) {
                const recentMap = JSON.parse(stored);
                const recentForMeal = recentMap[activeMeal];
                if (recentForMeal && recentForMeal.length > 0) {
                    return { quickAddItems: recentForMeal.slice(0, 4), isUsingRecent: true };
                }
            }
        } catch (e) { /* ignore parse errors */ }
        return { quickAddItems: (QUICK_ADD_BY_MEAL[activeMeal] || QUICK_ADD_BY_MEAL.Snacks).slice(0, 8), isUsingRecent: false };
    }, [activeMeal]);

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

    // Change #5: One-time scan pulse
    useEffect(() => {
        const hasSeen = localStorage.getItem('seenScanTooltip');
        if (!hasSeen) {
            setShowScanPulse(true);
            const timer = setTimeout(() => {
                setShowScanPulse(false);
                localStorage.setItem('seenScanTooltip', 'true');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Close suggestions popover on outside click
    useEffect(() => {
        const handler = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        if (showSuggestions) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showSuggestions]);

    // Fetch most eaten foods from last 30 days
    useEffect(() => {
        console.log('[AddFoodView] frequentFoods effect triggered. User exists:', !!user);
        if (!user) { setLoadingFrequent(false); return; }
        const fetchFrequent = async () => {
            try {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 30);
                const startStr = getLocalDateStr(cutoff);
                console.log('[AddFoodView] Fetching frequent foods from', startStr, 'onwards for user', user.uid);
                const q = query(
                    collection(db, 'users', user.uid, 'daily_logs'),
                    where('__name__', '>=', startStr)
                );
                const snap = await getDocs(q);
                console.log('[AddFoodView] frequentFoods getDocs returned', snap.docs.length, 'documents');
                const counts = new Map(); // name -> { count, item }
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const logs = data.foodLogs || {};
                    Object.values(logs).flat().forEach(food => {
                        if (!food || !food.name) return;
                        const key = food.name.toLowerCase().trim();
                        const existing = counts.get(key);
                        if (existing) {
                            existing.count += 1;
                        } else {
                            counts.set(key, {
                                count: 1,
                                item: {
                                    name: food.name,
                                    portion: food.weight || food.portion || '1 serving',
                                    calories: food.calories || 0,
                                    protein: food.protein || 0,
                                    carbs: food.carbs || 0,
                                    fat: food.fat || 0,
                                    icon: '🍽️'
                                }
                            });
                        }
                    });
                });
                // Sort by frequency, take top 8
                const sorted = Array.from(counts.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map(entry => entry.item);
                console.log('[AddFoodView] frequentFoods computed:', sorted.length, 'items', sorted.map(i => i.name));
                setFrequentFoods(sorted);
            } catch (e) {
                console.error('[AddFoodView] Error fetching frequent foods:', e);
            } finally {
                setLoadingFrequent(false);
            }
        };
        fetchFrequent();
    }, [user]);

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
        if (!query.trim()) { console.warn('[AddFoodView] AI Submit blocked: empty query'); return; }
        console.log('[AddFoodView] AI Submit started. Query:', query, 'Type:', type);
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
            prompt = `Estimate calories burned for this activity: "${query}". User Stats: Age ${userStats.age}, Weight ${userStats.weight}kg, Height ${userStats.height}cm. Return ONLY a valid JSON array with 2-3 variations. Example: [{"name": "Running (moderate)", "duration": "30 mins", "calories": 300, "confidence": 0.9}, {"name": "Running (intense)", "duration": "30 mins", "calories": 450, "confidence": 0.85}].`;
        } else {
            prompt = `Analyze this meal description: "${query}". You are a nutrition expert specializing in Indian and international cuisine. Estimate calories, protein (g), carbs (g), fat (g), and approximate weight with high accuracy. Use standard USDA and Indian food composition tables. Be precise with portion sizes. For common items like roti, rice, dal, chai, eggs, etc., use well-established values. Provide 2-3 portion size variations. Return ONLY a valid JSON object: {"suggestions": [{"name": "Food Name", "weight": "200g", "calories": 350, "protein": 15, "carbs": 40, "fat": 12, "confidence": 0.92}], "alternatives": ["Alt 1", "Alt 2"]}. Set confidence to 0.85+ for common foods and 0.7+ for complex mixed meals. Never below 0.6.`;
        }

        try {
            if (!apiKey) {
                throw new Error('No AI API key configured. Check VITE_GEMINI_API_KEY env variable.');
            }
            console.log('[AddFoodView] AI fetching from Gemini API...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            console.log('[AddFoodView] AI response status:', response.status, response.statusText);
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                console.error('[AddFoodView] AI response has no candidates. Full response:', JSON.stringify(data).slice(0, 500));
                throw new Error("No response from AI");
            }
            const text = data.candidates[0].content.parts[0].text;
            console.log('[AddFoodView] AI raw text length:', text.length);
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonString);
            console.log('[AddFoodView] AI parsed successfully. Suggestions count:', parsed.suggestions?.length || parsed.length || 0);

            if (type === 'exercise') {
                if (Array.isArray(parsed)) setAiResult({ suggestions: parsed, alternatives: [] });
            } else {
                if (parsed.suggestions) setAiResult(parsed);
                else if (Array.isArray(parsed)) setAiResult({ suggestions: parsed, alternatives: [] });
            }
        } catch (err) {
            console.error('[AddFoodView] AI Analysis FAILED:', err.message, err);
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

    // Handle food add with toast + save to recent meals (Change #6)
    const handleAddFood = (item) => {
        const targetMeal = type === 'exercise' ? 'exercise' : activeMeal;
        console.log('[AddFoodView] handleAddFood called. Item:', item.name, 'Target meal:', targetMeal, 'onAdd exists:', !!onAdd);
        setLastAddedItem({ item, meal: targetMeal });
        if (!onAdd) {
            console.error('[AddFoodView] CRITICAL: onAdd prop is missing! Food will not be saved.');
            return;
        }
        onAdd(item, targetMeal);
        setToast({ message: `${item.name} added ✓`, type: 'success' });

        // Save to localStorage recent meals
        if (type !== 'exercise') {
            try {
                const stored = localStorage.getItem('recentMeals');
                const recentMap = stored ? JSON.parse(stored) : {};
                const mealRecents = recentMap[activeMeal] || [];
                const newItem = {
                    name: item.name,
                    portion: item.weight || item.portion,
                    calories: item.calories,
                    protein: item.protein || 0,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0
                };
                // Remove duplicate and add to front
                const filtered = mealRecents.filter(r => r.name !== newItem.name);
                recentMap[activeMeal] = [newItem, ...filtered].slice(0, 8);
                localStorage.setItem('recentMeals', JSON.stringify(recentMap));
            } catch (e) { /* ignore */ }
        }

        // Haptic feedback (if available)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    // Handle undo - not wired to delete from Firestore, so disabled
    const handleUndo = null;

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
        // Extract numeric weight from strings like "200g", "1 bowl, 200g", etc.
        const weightMatch = String(item.weight).match(/(\d+)\s*g/i);
        const originalWeight = weightMatch ? parseInt(weightMatch[1]) : (parseInt(item.weight) || 200);
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
        setSearchQuery(searchTerm);
        setSelectedCategory(null); // exit category view when searching
        if (searchTerm.length >= 2) {
            // Search across ALL food sources
            const quickItems = Object.values(QUICK_ADD_BY_MEAL).flat();
            const catItems = Object.values(FOOD_BY_CATEGORY).flat();
            const allItems = [...quickItems, ...catItems];
            // Deduplicate by name
            const seen = new Set();
            const filtered = allItems.filter(item => {
                const key = item.name.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return key.includes(searchTerm.toLowerCase());
            });
            setSearchResults(filtered.slice(0, 15));
        } else {
            setSearchResults([]);
        }
    };

    // Category selection handler
    const handleCategorySelect = (categoryName) => {
        setSelectedCategory(categoryName);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Change #9: Get random suggestions that differ from last set
    const getRandomSuggestions = () => {
        const pool = mealSuggestions[activeMeal] || mealSuggestions.Snacks;
        let available = pool.filter(s => !lastSuggestionSet.includes(s));
        if (available.length < 3) available = [...pool]; // reset if exhausted
        const shuffled = available.sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 3);
        setLastSuggestionSet(picked);
        return picked;
    };

    const [currentSuggestions, setCurrentSuggestions] = useState([]);

    const handleToggleSuggestions = () => {
        if (!showSuggestions) {
            setCurrentSuggestions(getRandomSuggestions());
        }
        setShowSuggestions(!showSuggestions);
    };

    // Styles
    const isDark = theme === 'dark';
    const modalBg = isDark ? 'bg-[#000000]' : (theme === 'wooden' ? 'bg-[#EAD8B1]' : 'bg-[#F2F2F7]');
    const headerBg = styles.card;
    const inputBg = isDark ? 'bg-[#1C1C1E]' : 'bg-white';
    const cardBg = isDark ? 'bg-[#1C1C1E]' : 'bg-white';
    const glassCard = isDark
        ? 'backdrop-blur-xl bg-[#1C1C1E]/80 border border-white/10'
        : 'bg-white border border-slate-100 shadow-sm';

    const getMealTabStyle = (mealName, active) => {
        if (!active) {
            return isDark
                ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.08)' }
                : { background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' };
        }
        const cfg = MEAL_TAB_CONFIG[mealName];
        return isDark
            ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border }
            : { background: '#000', color: '#fff', borderColor: '#000' };
    };

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col ${modalBg}`}>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-md mx-auto px-5 pt-6 pb-32 relative z-10">

                    {/* ════ HEADER ════ */}
                    <div className="flex items-start justify-between mb-7">
                        <div>
                            <p className={`text-[11px] tracking-[0.14em] font-bold uppercase mb-1.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                ✦ {type === 'exercise' ? 'Log Activity' : (editingFood ? 'Edit Item' : 'AI Food Entry')}
                            </p>
                            <h1 className={`text-4xl font-black leading-none ${styles.textMain}`}
                                style={isDark ? { background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
                                {type === 'exercise' ? 'New Workout' : (editingFood ? 'Update Entry' : 'New Entry')}
                            </h1>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/[0.07] border border-white/10 text-white/40 hover:bg-white/[0.13] hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* ════ MEAL TABS ════ */}
                    {type !== 'exercise' && (
                        <div className="mb-6">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {MEAL_OPTIONS.map(m => {
                                    const isActive = activeMeal === m;
                                    const cfg = MEAL_TAB_CONFIG[m];
                                    const tabStyle = getMealTabStyle(m, isActive);
                                    return (
                                        <button
                                            key={m}
                                            onClick={() => { setActiveMeal(m); setMealAutoSelected(false); }}
                                            className="px-4 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap border"
                                            style={tabStyle}
                                            aria-label={`Select ${m} meal`}
                                        >
                                            {cfg.emoji} {m}
                                        </button>
                                    );
                                })}
                            </div>
                            {mealAutoSelected && (
                                <p className={`text-[10px] mt-1.5 ml-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                    Auto-selected · tap to change
                                </p>
                            )}
                        </div>
                    )}

                    {/* ════ AI INPUT CARD ════ */}
                    <div className={`rounded-3xl p-6 mb-4 transition-all ${glassCard}`}
                        style={inputFocused ? { boxShadow: '0 0 40px rgba(52,211,153,0.08)' } : {}}>

                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className={`text-[15px] font-bold ${styles.textMain}`}>
                                    {type === 'exercise' ? 'Describe your workout' : 'What did you eat?'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Reset / Clear button */}
                                {(query.trim() || aiResult) && (
                                    <button
                                        onClick={() => { setQuery(''); setAiResult(null); setError(''); inputRef.current?.focus(); }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${isDark ? 'bg-white/[0.06] text-white/40 border border-white/[0.08] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
                                        title="Clear search & result"
                                        aria-label="Reset"
                                    >
                                        <X size={12} strokeWidth={3} /> Reset
                                    </button>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                                    <span className="text-[11px] font-extrabold tracking-wide"
                                        style={{ background: 'linear-gradient(90deg, #34d399, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        AI POWERED
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sparkle suggestions trigger */}
                        <div className="absolute top-4 right-4" ref={suggestionsRef}>
                            <button
                                onClick={handleToggleSuggestions}
                                className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${showSuggestions
                                        ? (isDark ? 'bg-purple-500/30 text-purple-400' : 'bg-indigo-100 text-indigo-600')
                                        : (isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400')
                                    }`}
                                title="Smart suggestions"
                                aria-label="Smart meal suggestions"
                            >
                                <Sparkles size={16} />
                            </button>
                            {showSuggestions && (
                                <div className={`absolute top-10 right-0 w-56 p-3 rounded-2xl shadow-xl border z-20 animate-fade-in ${isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                        Try for {activeMeal}
                                    </p>
                                    <div className="space-y-1">
                                        {currentSuggestions.map((sug, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setQuery(sug); setShowSuggestions(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-50'}`}
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Textarea */}
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                className={`w-full bg-transparent text-lg outline-none resize-none ${isDark ? 'placeholder:text-white/20' : 'placeholder:text-gray-400'} ${styles.textMain} ${isAnalyzing ? 'opacity-50' : ''}`}
                                rows={4}
                                placeholder={type === 'exercise' ? "e.g. 30 mins jogging at moderate pace..." : placeholder}
                                value={query}
                                onChange={handleQueryChange}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' && !e.shiftKey) || (e.ctrlKey && e.key === 'Enter')) {
                                        e.preventDefault();
                                        handleAISubmit();
                                    }
                                }}
                                disabled={isAnalyzing}
                                maxLength={200}
                                aria-label="Meal description input"
                            />
                            {query.length >= 150 && (
                                <span className={`absolute bottom-0 right-0 text-xs font-medium ${query.length >= 190 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {query.length}/200
                                </span>
                            )}
                        </div>

                        {/* Char hint */}
                        <p className={`text-[11px] mt-1.5 min-h-[16px] transition-colors ${query.length > 2 ? 'text-emerald-400/60' : (isDark ? 'text-white/20' : 'text-gray-400')}`}>
                            {query.length > 2 ? `✓ Ready to analyze · ${query.split(' ').length} words` : (query.length > 0 ? 'Keep typing...' : '')}
                        </p>

                        {/* Voice indicator */}
                        <VoiceRecordingIndicator isListening={isVoiceListening} isProcessing={isVoiceProcessing} theme={theme} />

                        {/* Divider */}
                        <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

                        {/* Input modes */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleVoiceInput}
                                disabled={isAnalyzing}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isVoiceListening
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : (isDark ? 'bg-white/[0.04] text-white/40 border border-white/[0.08] hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200')
                                    }`}
                            >
                                <Mic size={14} /> Voice Input
                            </button>
                            {type !== 'exercise' && (
                                <div className="relative">
                                    <button
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${showScanPulse ? 'animate-pulse' : ''} ${isDark ? 'bg-white/[0.04] text-white/40 border border-white/[0.08] hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                                        title="Scan a food label or barcode"
                                    >
                                        <ScanLine size={14} /> Scan Barcode
                                    </button>
                                    {showScanPulse && (
                                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap z-30 shadow-lg ${isDark ? 'bg-[#1C1C1E] text-white border border-white/10' : 'bg-black text-white'}`}>
                                            Scan a food label
                                            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-[#1C1C1E]' : 'bg-black'}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setShowSearchOverlay(true)}
                                className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isDark ? 'bg-white/[0.04] text-white/40 border border-white/[0.08] hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                            >
                                <Search size={14} /> Search
                            </button>
                        </div>
                    </div>

                    {/* ════ ANALYZE BUTTON ════ */}
                    <div className="mb-5">
                        <button
                            onClick={handleAISubmit}
                            disabled={!query.trim() || isAnalyzing}
                            className="w-full py-4 rounded-2xl font-extrabold text-sm transition-all relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                                color: '#000',
                                opacity: !query.trim() || isAnalyzing ? 0.4 : 1,
                                boxShadow: query.trim() && !isAnalyzing ? '0 4px 24px rgba(52,211,153,0.3)' : 'none',
                                cursor: !query.trim() || isAnalyzing ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" /> Analyzing your meal...
                                </span>
                            ) : (
                                <>✦ &nbsp;Analyze with AI</>
                            )}
                        </button>
                        <p className={`text-[11px] text-center mt-2.5 ${isDark ? 'text-white/18' : 'text-gray-400'}`}>
                            Ctrl + Enter to analyze quickly
                        </p>
                    </div>

                    {/* First-time tooltip */}
                    {showTooltip && (
                        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 animate-fade-in ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            <Sparkles size={16} />
                            <span className="text-sm font-medium">Describe your meal in plain language ✨</span>
                        </div>
                    )}

                    {/* ════ ERROR MESSAGE ════ */}
                    {error && (
                        <div className="mb-5 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl">
                            <p className="text-sm mb-3">{error}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setQuery('')} className="px-3 py-1.5 bg-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors">
                                    Add Quantity
                                </button>
                                <button onClick={() => { setShowSearchOverlay(true); setError(''); }} className="px-3 py-1.5 bg-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors">
                                    Try Search Instead
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ════ AI SUGGESTIONS (LOADING) ════ */}
                    {isAnalyzing && (
                        <div className="mb-6 space-y-3">
                            <h3 className={`text-sm font-bold ${styles.textSec} uppercase tracking-widest ml-1`}>AI Suggestions</h3>
                            <SkeletonCard theme={theme} />
                            <SkeletonCard theme={theme} />
                            <SkeletonCard theme={theme} />
                        </div>
                    )}

                    {/* ════ RESULT CARD ════ */}
                    {aiResult && !isAnalyzing && (
                        <div className="mb-6 space-y-4">
                            {aiResult.suggestions.map((item, idx) => {
                                const totalMacros = (item.protein || 0) + (item.carbs || 0) + (item.fat || 0);
                                const pFlex = totalMacros > 0 ? Math.max(1, Math.round((item.protein / totalMacros) * 100)) : 1;
                                const cFlex = totalMacros > 0 ? Math.max(1, Math.round((item.carbs / totalMacros) * 100)) : 1;
                                const fFlex = totalMacros > 0 ? Math.max(1, Math.round((item.fat / totalMacros) * 100)) : 1;
                                return (
                                    <div key={idx} className={`rounded-3xl p-6 relative overflow-hidden ${glassCard}`}>
                                        {/* Weight Editor Overlay */}
                                        {editingWeight === idx && (
                                            <WeightEditor
                                                value={item.weight}
                                                onChange={(newWeight) => handleWeightUpdate(idx, newWeight)}
                                                onClose={() => setEditingWeight(null)}
                                                theme={theme}
                                            />
                                        )}

                                        {/* AI Analysis Complete badge */}
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
                                            style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
                                            <span className="text-[11px] font-bold text-emerald-400 tracking-wide">AI ANALYSIS COMPLETE</span>
                                        </div>

                                        {/* Food + kcal */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex-1 mr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`text-xl font-extrabold leading-tight ${styles.textMain}`}>{item.name}</p>
                                                    {item.confidence && <ConfidenceIndicator score={item.confidence} theme={theme} />}
                                                </div>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                                    ~{item.weight} estimated portion
                                                </p>
                                                {type === 'exercise' && (
                                                    <p className="text-sm text-blue-500 font-medium mt-1">{item.duration}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[40px] font-black leading-none"
                                                    style={{ background: 'linear-gradient(135deg, #34d399, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                    {item.calories}
                                                </p>
                                                <p className={`text-[11px] font-semibold ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                                    {type === 'exercise' ? 'burned' : 'kcal'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Macro bar visual */}
                                        {type !== 'exercise' && (
                                            <div className="h-1.5 rounded-full overflow-hidden flex gap-0.5 mb-3">
                                                <div style={{ flex: pFlex, background: '#60a5fa', borderRadius: '99px' }} />
                                                <div style={{ flex: cFlex, background: '#34d399', borderRadius: '99px' }} />
                                                <div style={{ flex: fFlex, background: '#fb923c', borderRadius: '99px' }} />
                                            </div>
                                        )}

                                        {/* Macro chips */}
                                        {type !== 'exercise' && (
                                            <div className="flex gap-2 flex-wrap mb-5">
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    🔵 Protein {item.protein}g
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    🟢 Carbs {item.carbs}g
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                    🟠 Fat {item.fat}g
                                                </span>
                                            </div>
                                        )}

                                        {/* Expandable Macros */}
                                        {type !== 'exercise' && (
                                            <button
                                                onClick={() => toggleMacroExpansion(idx)}
                                                className={`text-xs flex items-center gap-1 mb-3 ${isDark ? 'text-white/30' : 'text-gray-400'} hover:opacity-80`}
                                            >
                                                <ChevronDown size={14} className={`transform transition-transform ${expandedMacros.has(idx) ? 'rotate-180' : ''}`} />
                                                {expandedMacros.has(idx) ? 'Hide' : 'Show'} macros
                                            </button>
                                        )}
                                        {expandedMacros.has(idx) && type !== 'exercise' && (
                                            <div className="mb-4 space-y-2 animate-fade-in">
                                                <MacroBar label="Protein" value={item.protein} max={50} color="bg-blue-500" theme={theme} />
                                                <MacroBar label="Carbs" value={item.carbs} max={100} color="bg-green-500" theme={theme} />
                                                <MacroBar label="Fat" value={item.fat} max={50} color="bg-orange-500" theme={theme} />
                                            </div>
                                        )}

                                        {/* Low confidence warning */}
                                        {item.confidence && item.confidence < 0.5 && (
                                            <div className="mb-3 flex items-center gap-1.5 text-xs text-amber-400">
                                                <AlertCircle size={12} />
                                                <span className="font-medium">Low confidence — please verify</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2.5 mb-3">
                                            <button
                                                onClick={() => handleAddFood(item)}
                                                className="flex-1 py-4 rounded-2xl font-extrabold text-sm text-black transition-all hover:-translate-y-0.5"
                                                style={{
                                                    background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                                                    boxShadow: '0 4px 24px rgba(52,211,153,0.3)'
                                                }}
                                            >
                                                ✓ &nbsp;Log it
                                            </button>
                                            <button
                                                onClick={() => setEditingWeight(idx)}
                                                className={`px-5 py-4 rounded-2xl font-semibold text-sm transition-all ${isDark ? 'bg-white/[0.07] text-white/70 border border-white/[0.12] hover:bg-white/[0.12]' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                                            >
                                                ✏️ Adjust
                                            </button>
                                        </div>
                                        <p className="text-center text-xs text-emerald-400/55 cursor-pointer font-semibold"
                                            onClick={() => { setAiResult(null); inputRef.current?.focus(); }}>
                                            ↻ &nbsp;Re-analyze with different portion
                                        </p>
                                    </div>
                                );
                            })}

                            {/* Alternative suggestions */}
                            {aiResult.alternatives && aiResult.alternatives.length > 0 && (
                                <div className={`mt-2 p-3 rounded-xl ${isDark ? 'bg-[#1C1C1E]' : 'bg-gray-50'}`}>
                                    <p className={`text-xs mb-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Not quite right? Try:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aiResult.alternatives.map((alt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setQuery(alt); setAiResult(null); }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-white/[0.04] text-white border border-white/[0.08]' : 'bg-white text-gray-700 border border-gray-200'} hover:opacity-80 transition-colors`}
                                            >
                                                {alt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════ SMART SUGGESTION BANNER ════ */}
                    {type !== 'exercise' && foodPatterns?.suggestion && (
                        <div className={`mb-6 p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-500/30' : 'bg-indigo-100'}`}>
                                    <Zap size={18} className={isDark ? 'text-purple-400' : 'text-indigo-600'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${styles.textMain}`}>{foodPatterns.suggestion}</p>
                                </div>
                                <button className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-purple-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                    + Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ════ FOOD DATABASE SEARCH TRIGGER ════ */}
                    {type !== 'exercise' && (
                        <div className="mb-7">
                            <button
                                onClick={() => setShowSearchOverlay(true)}
                                className={`w-full py-3.5 rounded-2xl text-[13px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-white/[0.03] text-emerald-400/70 border border-white/[0.08] hover:bg-emerald-400/5 hover:border-emerald-400/25' : 'bg-gray-50 text-blue-600 border border-gray-200 hover:bg-blue-50'}`}
                            >
                                <Search size={15} strokeWidth={2.5} /> Search food database
                            </button>
                        </div>
                    )}

                    {/* ════ RECENTLY LOGGED ════ */}
                    {type !== 'exercise' && (
                        <div className="mb-7">
                            <div className="flex items-center justify-between mb-3.5">
                                <p className={`text-sm font-bold ${styles.textMain}`}>Recently logged today</p>
                                <p className={`text-[11px] font-semibold cursor-pointer ${isDark ? 'text-emerald-400/60' : 'text-emerald-600'}`}>Tap + to re-add</p>
                            </div>
                            {recentFoods.length === 0 && (
                                <p className={`text-xs ${isDark ? 'text-white/20' : 'text-gray-400'} mb-2`}>
                                    [Debug] recentFoods is empty — no recently logged items to show.
                                </p>
                            )}
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {recentFoods.slice(0, 8).map((food, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddFood(food)}
                                        className={`flex-shrink-0 p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-left ${cardBg} ${styles.border}`}
                                        style={{ minWidth: '152px' }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[28px]">{food.icon || '🍽️'}</span>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                +
                                            </div>
                                        </div>
                                        <p className={`text-[13px] font-bold truncate ${styles.textMain}`}>{food.name}</p>
                                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{food.portion || food.weight}</p>
                                        <p className="text-[13px] font-extrabold text-orange-400 mt-1">{food.calories} kcal</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ════ FAVORITES ════ */}
                    {type !== 'exercise' && (
                        <div className="mb-7">
                            <p className={`text-sm font-bold mb-3.5 ${styles.textMain}`}>⭐ Favorites</p>
                            {frequentFoods.length === 0 && !loadingFrequent && (
                                <div className="rounded-3xl p-9 text-center"
                                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div className="text-[40px] mb-3 grayscale opacity-50">🌟</div>
                                    <p className={`text-[15px] font-bold ${isDark ? 'text-white/35' : 'text-gray-400'}`}>No favorites yet</p>
                                    <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-white/18' : 'text-gray-400'}`}>
                                        Foods you log 3+ times will<br />automatically appear here
                                    </p>
                                    <button
                                        onClick={() => setShowSearchOverlay(true)}
                                        className="mt-4 px-5 py-2 rounded-full text-xs font-bold cursor-pointer transition-all"
                                        style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
                                    >
                                        Browse food database →
                                    </button>
                                </div>
                            )}
                            {frequentFoods.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {frequentFoods.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickAdd(item)}
                                            className={`flex-shrink-0 p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-left ${cardBg} ${styles.border}`}
                                            style={{ minWidth: '152px' }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[28px]">{item.icon || '🍽️'}</span>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    +
                                                </div>
                                            </div>
                                            <p className={`text-[13px] font-bold truncate ${styles.textMain}`}>{item.name}</p>
                                            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{item.portion}</p>
                                            <p className="text-[13px] font-extrabold text-orange-400 mt-1">{item.calories} kcal</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════ QUICK ADD / RECENT ════ */}
                    {type !== 'exercise' && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                    {isUsingRecent ? 'Recent' : 'Quick Add'}
                                </h3>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {quickAddItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickAdd(item)}
                                        className={`flex-shrink-0 p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-left ${cardBg} ${styles.border}`}
                                        style={{ minWidth: '152px' }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[28px]">{item.icon || '🍽️'}</span>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                +
                                            </div>
                                        </div>
                                        <p className={`text-[13px] font-bold truncate ${styles.textMain}`}>{item.name}</p>
                                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{item.portion}</p>
                                        <p className="text-[13px] font-extrabold text-orange-400 mt-1">{item.calories} kcal</p>
                                    </button>
                                ))}
                            </div>
                            {!isUsingRecent && quickAddItems.length > 8 && (
                                <button className={`w-full mt-3 py-2 text-sm font-medium ${isDark ? 'text-[#7ab4ff]' : 'text-blue-600'}`}>
                                    Show more ({(QUICK_ADD_BY_MEAL[activeMeal] || []).length - 8} items)
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* ════ SEARCH OVERLAY ════ */}
            {showSearchOverlay && (
                <div className={`fixed inset-0 z-[70] flex flex-col ${modalBg} animate-slide-up`}>
                    <div className={`px-6 pt-12 pb-4 ${headerBg}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <button onClick={() => setShowSearchOverlay(false)} className={`p-2 rounded-full ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
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
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                            {recentSearches.map((term, idx) => (
                                <button key={idx} onClick={() => handleSearch(term)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${isDark ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-gray-700'}`}>
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((item, idx) => (
                                    <button key={idx}
                                        onClick={() => { handleQuickAdd(item); setShowSearchOverlay(false); }}
                                        className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${cardBg} ${styles.border} border transition-colors hover:opacity-90`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon || '🍽️'}</span>
                                            <div>
                                                <p className={`font-bold ${styles.textMain}`}>{item.name}</p>
                                                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{item.portion}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${isDark ? 'text-[#4ade80]' : 'text-emerald-600'}`}>{item.calories} kcal</p>
                                            <Plus size={16} className={styles.accentBlueText} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : selectedCategory ? (
                            <div>
                                <button onClick={() => setSelectedCategory(null)}
                                    className={`flex items-center gap-2 mb-4 text-sm font-semibold ${isDark ? 'text-[#7ab4ff]' : 'text-blue-600'}`}>
                                    ← Back to Categories
                                </button>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{selectedCategory}</h3>
                                <div className="space-y-2">
                                    {(FOOD_BY_CATEGORY[selectedCategory] || []).map((item, idx) => (
                                        <button key={idx}
                                            onClick={() => { handleQuickAdd(item); setShowSearchOverlay(false); }}
                                            className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${cardBg} ${styles.border} border transition-colors hover:opacity-90 active:scale-[0.98]`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon || '🍽️'}</span>
                                                <div>
                                                    <p className={`font-bold ${styles.textMain}`}>{item.name}</p>
                                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{item.portion}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className={`font-bold ${isDark ? 'text-[#4ade80]' : 'text-emerald-600'}`}>{item.calories} kcal</p>
                                                <div className={`p-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                                    <Plus size={14} className={styles.accentBlueText} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : searchQuery.length > 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No results found</p>
                                <p className="text-sm mt-2">Not in database? Use AI Log to add custom foods</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Browse by Category</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {FOOD_CATEGORIES.map((cat, idx) => (
                                        <button key={idx} onClick={() => handleCategorySelect(cat.name)}
                                            className={`p-4 rounded-2xl text-left ${cardBg} ${styles.border} border transition-all hover:scale-[1.02] active:scale-95`}>
                                            <span className="text-2xl mb-2 block">{cat.icon}</span>
                                            <p className={`font-bold ${styles.textMain}`}>{cat.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{cat.items} items</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════ TOAST ════ */}
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
