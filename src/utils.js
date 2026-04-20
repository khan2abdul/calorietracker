import {
    MEAL_TIME_BOUNDARIES,
    KCAL_PER_KG,
    SAFE_CALORIE_FLOOR,
    DEFAULT_CALORIE_GOAL,
    DEFAULT_CALORIE_DEFICIT,
    getTimeBasedMeal,
} from './config';

export { getTimeBasedMeal } from './config';

export const generateHistoryData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const consumed = Math.floor(1800 + Math.random() * 800);
        const burned = Math.floor(300 + Math.random() * 1000);

        data.push({
            dateObj: d,
            date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            consumed: consumed,
            burned: burned,
            net: consumed - burned
        });
    }
    return data;
};

export function getDayBoundaries(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return {
        startTime: start.getTime(),
        endTime: end.getTime()
    };
}

export const calculateBMR = (stats) => {
    const { weight, height, age, gender } = stats;
    if (!weight || !height || !age) return 0;

    if (gender === 'female') {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    }
};

export const calculateTDEE = (stats) => {
    const bmr = calculateBMR(stats);
    if (bmr === 0) return 0;

    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extreme: 1.9
    };
    return bmr * (multipliers[stats.activity] || 1.2);
};

export const calculateGoalCals = (stats) => {
    const tdee = calculateTDEE(stats);
    if (tdee === 0) return DEFAULT_CALORIE_GOAL;

    const { weight, targetWeight, targetDays } = stats;

    if (targetWeight && targetWeight !== weight && targetDays && targetDays !== 'Auto') {
        const weightDiff = (targetWeight - weight);
        const totalCals = weightDiff * KCAL_PER_KG;
        const dailyChange = totalCals / targetDays;

        let goal = tdee + dailyChange;

        return Math.max(SAFE_CALORIE_FLOOR, Math.round(goal));
    }

    return Math.round(tdee - DEFAULT_CALORIE_DEFICIT);
};

export const getLocalDateStr = (date) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
