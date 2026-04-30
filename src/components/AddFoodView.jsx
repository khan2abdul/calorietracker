import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Mic, ArrowRight, Plus, Search, Edit2, Clock, ChevronDown, Undo2, Check, AlertCircle, HelpCircle, Zap, Star, Filter, TrendingUp, Loader2, Heart } from 'lucide-react';
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

// Confidence indicator component — only show warnings for genuinely low confidence
const ConfidenceIndicator = ({ score, theme }) => {
    if (score >= 0.75) {
        return null;
    } else if (score >= 0.5) {
        return <span className="flex items-center gap-1 text-xs text-amber-500 font-medium"><AlertCircle size={12} /> Approximate</span>;
    } else {
        return <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><HelpCircle size={12} /> Estimate only</span>;
    }
};

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
    const [foodWeight, setFoodWeight] = useState('');
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
    const [expandedMacros, setExpandedMacros] = useState(new Set());
    const [slowConnection, setSlowConnection] = useState(false);
    // Category browse state
    const [selectedCategory, setSelectedCategory] = useState(null);
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

    // Food variation pills based on query
    const FOOD_VARIATIONS = {
        rice: ['White rice', 'Brown rice', 'Basmati rice', 'Fried rice', 'Jeera rice'],
        chicken: ['Grilled chicken', 'Chicken curry', 'Chicken breast', 'Chicken biryani', 'Tandoori chicken'],
        roti: ['Roti', 'Chapati', 'Naan', 'Paratha', 'Tandoori roti'],
        dal: ['Dal tadka', 'Dal fry', 'Moong dal', 'Masoor dal', 'Toor dal'],
        egg: ['Boiled egg', 'Omelette', 'Scrambled eggs', 'Egg curry', 'Poached egg'],
        paneer: ['Paneer butter masala', 'Grilled paneer', 'Paneer tikka', 'Palak paneer', 'Paneer bhurji'],
        fish: ['Grilled fish', 'Fish curry', 'Fish fry', 'Fish tikka', 'Fish biryani'],
        salad: ['Green salad', 'Caesar salad', 'Fruit salad', 'Cucumber salad', 'Sprout salad'],
        bread: ['Bread toast', 'Bread butter', 'Bread sandwich', 'Garlic bread', 'Whole wheat bread'],
        oats: ['Oats porridge', 'Oats with milk', 'Overnight oats', 'Oats upma', 'Oats chilla'],
        banana: ['Banana', 'Banana smoothie', 'Banana shake', 'Banana chips', 'Banana with milk'],
        milk: ['Milk', 'Cold milk', 'Hot milk', 'Milkshake', 'Turmeric milk'],
        tea: ['Tea', 'Green tea', 'Black tea', 'Masala chai', 'Lemon tea'],
        coffee: ['Coffee', 'Black coffee', 'Cold coffee', 'Cappuccino', 'Latte'],
        dosa: ['Plain dosa', 'Masala dosa', 'Rava dosa', 'Onion dosa', 'Mysore dosa'],
        idli: ['Idli', 'Masala idli', 'Rava idli', 'Idli sambar', 'Fried idli'],
        samosa: ['Samosa', 'Aloo samosa', 'Paneer samosa', 'Samosa chaat', 'Baked samosa'],
        biryani: ['Chicken biryani', 'Veg biryani', 'Mutton biryani', 'Egg biryani', 'Hyderabadi biryani'],
        soup: ['Tomato soup', 'Veg soup', 'Chicken soup', 'Mushroom soup', 'Sweet corn soup'],
    };

    const foodPills = useMemo(() => {
        if (!query.trim() || query.trim().length < 2) return [];
        const lower = query.toLowerCase().trim();
        for (const [key, variations] of Object.entries(FOOD_VARIATIONS)) {
            if (lower.includes(key)) {
                return variations;
            }
        }
        return [];
    }, [query]);

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
        const explicitWeight = foodWeight.trim();
        const queryWeightMatch = query.match(/(\d+)\s*(gm|g|grams?|grms?)\b/i);
        const detectedWeight = explicitWeight || (queryWeightMatch ? queryWeightMatch[1] : '');
        if (!explicitWeight && detectedWeight) {
            setFoodWeight(detectedWeight);
        }
        if (type === 'exercise') {
            prompt = `Estimate calories burned for this activity: "${query}". User Stats: Age ${userStats.age}, Weight ${userStats.weight}kg, Height ${userStats.height}cm. Return ONLY a valid JSON array with 2-3 variations. Example: [{"name": "Running (moderate)", "duration": "30 mins", "calories": 300, "confidence": 0.9}, {"name": "Running (intense)", "duration": "30 mins", "calories": 450, "confidence": 0.85}].`;
        } else {
            const finalWeight = detectedWeight || foodWeight.trim() || '200';
            prompt = `Calculate exact nutrition for ${finalWeight}g of: "${query}".

Return ONLY this JSON, nothing else:
{"suggestions": [{"name": "Food Name", "weight": "${finalWeight}g", "calories": 130, "protein": 2.7, "carbs": 28.2, "fat": 0.3, "confidence": 0.95}], "alternatives": []}

IMPORTANT: All values must be calculated EXACTLY for ${finalWeight}g. Not for any other weight. Use standard per-100g nutrition data and multiply by ${finalWeight}/100.`;
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

            // Always keep only the first suggestion
            let result;
            if (type === 'exercise') {
                const items = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
                result = { suggestions: items.slice(0, 1), alternatives: [] };
            } else {
                const items = parsed.suggestions || (Array.isArray(parsed) ? parsed : []);
                const first = items[0];
                if (first) {
                    const userWeight = parseInt(foodWeight) || parseInt(detectedWeight) || 200;
                    // If AI returned a different weight than requested, scale to user's weight
                    const aiWeight = parseInt(first.weight) || userWeight;
                    const scale = userWeight / aiWeight;
                    result = {
                        suggestions: [{
                            ...first,
                            weight: `${userWeight}g`,
                            calories: Math.round(first.calories * scale),
                            protein: Math.round(first.protein * scale * 10) / 10,
                            carbs: Math.round(first.carbs * scale * 10) / 10,
                            fat: Math.round(first.fat * scale * 10) / 10,
                        }],
                        alternatives: []
                    };
                } else {
                    result = { suggestions: [], alternatives: [] };
                }
            }
            setAiResult(result);
        } catch (err) {
            console.error('[AddFoodView] AI Analysis FAILED:', err.message, err);

            // Fallback: generate a local estimate (no error flash)
            const w = parseInt(foodWeight) || 200;
            const scale = w / 100;
            if (type === 'exercise') {
                setAiResult({
                    suggestions: [
                        { name: query, duration: "30 mins", calories: 250, confidence: 0.5 }
                    ],
                    alternatives: []
                });
            } else {
                setAiResult({
                    suggestions: [
                        { name: query, weight: `${w}g`, calories: Math.round(140 * scale), protein: Math.round(6 * scale * 10) / 10, carbs: Math.round(18 * scale * 10) / 10, fat: Math.round(5 * scale * 10) / 10, confidence: 0.5 }
                    ],
                    alternatives: []
                });
            }
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
                    <div className={`rounded-2xl overflow-hidden mb-6 transition-all ${glassCard}`}
                        style={inputFocused ? { boxShadow: '0 0 40px rgba(52,211,153,0.08)' } : {}}>

                        {/* Topbar */}
                        <div className={`flex items-center justify-between px-4 py-3 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className={`text-sm font-bold ${styles.textMain}`}>
                                    {type === 'exercise' ? 'Log Activity' : 'Log a meal'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {(query.trim() || aiResult) && (
                                    <button
                                        onClick={() => { setQuery(''); setFoodWeight(''); setAiResult(null); setError(''); inputRef.current?.focus(); }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${isDark ? 'bg-white/[0.06] text-white/40 border border-white/[0.08] hover:bg-red-500/20 hover:text-red-400' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
                                        aria-label="Reset"
                                    >
                                        <X size={10} strokeWidth={3} /> Reset
                                    </button>
                                )}
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide"
                                    style={{ background: 'linear-gradient(90deg, #34d399, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    AI Powered
                                </span>
                            </div>
                        </div>

                        <div className="px-4 pt-4 pb-3">
                            {/* Food name section */}
                            <div className="mb-3">
                                <label className={`text-[11px] font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                    {type === 'exercise' ? 'What did you do?' : 'What did you eat?'}
                                </label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className={`w-full pr-10 pl-0 py-2.5 bg-transparent text-[15px] font-semibold outline-none border-b-2 transition-colors ${isDark ? 'border-white/10 focus:border-emerald-400/50 placeholder:text-white/20' : 'border-gray-200 focus:border-emerald-400 placeholder:text-gray-400'} ${styles.textMain} ${isAnalyzing ? 'opacity-50' : ''}`}
                                        placeholder={type === 'exercise' ? "e.g. 30 mins jogging..." : "e.g. Grilled chicken..."}
                                        value={query}
                                        onChange={handleQueryChange}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAISubmit();
                                            }
                                        }}
                                        disabled={isAnalyzing}
                                        maxLength={200}
                                        aria-label="Food name input"
                                    />
                                    <Edit2 size={16} className={`absolute right-0 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
                                </div>
                            </div>

                            {/* Suggestion pills */}
                            {type !== 'exercise' && foodPills.length > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
                                    {foodPills.map((pill, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(pill)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${query === pill
                                                ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                                                : (isDark ? 'bg-white/[0.05] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200')
                                            }`}
                                        >
                                            {pill}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Divider */}
                            <div className={`h-px my-3 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />

                            {/* Portion size section */}
                            {type !== 'exercise' && (
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Portion size</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className={`text-2xl font-black ${styles.textMain}`}>{foodWeight || '100'}</span>
                                            <span className={`text-[11px] font-semibold ${isDark ? 'text-white/30' : 'text-gray-400'}`}>g</span>
                                        </div>
                                    </div>
                                    {/* Slider */}
                                    <div className="mb-3">
                                        <input
                                            type="range"
                                            min="50"
                                            max="500"
                                            step="25"
                                            value={foodWeight || '100'}
                                            onChange={(e) => setFoodWeight(e.target.value)}
                                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, ${isDark ? '#34d399' : '#10b981'} ${((parseInt(foodWeight) || 100) - 50) / 450 * 100}%, ${isDark ? '#2C2C2E' : '#e5e7eb'} ${((parseInt(foodWeight) || 100) - 50) / 450 * 100}%)`,
                                                WebkitAppearance: 'none'
                                            }}
                                            aria-label="Portion in grams"
                                        />
                                        <div className="flex justify-between mt-1">
                                            <span className={`text-[9px] ${isDark ? 'text-white/20' : 'text-gray-300'}`}>50g</span>
                                            <span className={`text-[9px] ${isDark ? 'text-white/20' : 'text-gray-300'}`}>500g</span>
                                        </div>
                                    </div>
                                    {/* Chips */}
                                    <div className="flex gap-2">
                                        {[100, 150, 200, 250].map(w => (
                                            <button
                                                key={w}
                                                onClick={() => setFoodWeight(String(w))}
                                                className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${(parseInt(foodWeight) || 100) === w
                                                    ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                                                    : (isDark ? 'bg-white/[0.04] text-white/30 border border-white/[0.06]' : 'bg-gray-50 text-gray-400 border border-gray-200')
                                                }`}
                                            >
                                                {w}g
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ready row */}
                            <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#34d399' : '#10b981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className={`text-[11px] font-semibold ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                                    {query.trim() ? 'Ready to analyze' : 'Enter food name'}
                                </span>
                                {query.trim() && (
                                    <span className={`text-[10px] ml-auto ${isDark ? 'text-white/25' : 'text-gray-400'}`}>
                                        {query.split(/\s+/).filter(Boolean).length} words
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex gap-2 px-4 pb-4 pt-1`}>
                            <button
                                onClick={onClose}
                                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-white/[0.05] text-white/40 border border-white/[0.08] hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                            >
                                <X size={13} strokeWidth={2.5} />
                                Cancel
                            </button>
                            <button
                                onClick={handleAISubmit}
                                disabled={!query.trim() || isAnalyzing}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-xs text-black transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #34d399, #22d3ee)',
                                    opacity: !query.trim() || isAnalyzing ? 0.4 : 1,
                                    boxShadow: query.trim() && !isAnalyzing ? '0 4px 24px rgba(52,211,153,0.3)' : 'none',
                                    cursor: !query.trim() || isAnalyzing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                        Analyze with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

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
                                        </div>
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
