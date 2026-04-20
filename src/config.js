export const MEAL_TIME_BOUNDARIES = {
    Breakfast: { start: 5, end: 11 },
    Lunch: { start: 11, end: 16 },
    Snacks: { start: 16, end: 18 },
    Dinner: { start: 18, end: 22 },
};

export const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export const MEAL_ICONS = {
    Breakfast: '🍳',
    Lunch: '🍱',
    Dinner: '🍽️',
    Snacks: '🍿',
};

export const ACTIVITY_EMOJI = {
    walking: '🚶',
    running: '🏃',
    skipping: '⏭️',
    cycling: '🚴',
    gym: '🏋️',
    hiit: '🔥',
    cardio: '❤️‍🔥',
    exercise: '💪',
    other: '⚡',
};

export const TARGET_DAY_OPTIONS = [30, 45, 60, 75, 90, 'Auto'];

export const MACRO_RATIOS = {
    protein: 0.30,
    carbs: 0.40,
    fat: 0.30,
};

export const CALORIES_PER_GRAM = {
    protein: 4,
    carbs: 4,
    fat: 9,
};

export const KCAL_PER_KG = 7700;
export const DEFAULT_CALORIE_GOAL = 2000;
export const SAFE_CALORIE_FLOOR = 1200;
export const DEFAULT_CALORIE_DEFICIT = 500;
export const DEFAULT_BURN_GOAL_PCT = 0.30;
export const STEPS_PER_KM = 1350;

export function getTimeBasedMeal() {
    const hour = new Date().getHours();
    for (const [meal, { start, end }] of Object.entries(MEAL_TIME_BOUNDARIES)) {
        if (hour >= start && hour < end) return meal;
    }
    return 'Snacks';
}

export function calculateMacroGoals(goalCals) {
    const g = goalCals || DEFAULT_CALORIE_GOAL;
    return {
        pro: Math.round((g * MACRO_RATIOS.protein) / CALORIES_PER_GRAM.protein),
        carb: Math.round((g * MACRO_RATIOS.carbs) / CALORIES_PER_GRAM.carbs),
        fat: Math.round((g * MACRO_RATIOS.fat) / CALORIES_PER_GRAM.fat),
    };
}
