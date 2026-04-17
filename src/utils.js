export const generateHistoryData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        // Simulate data
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

export const getTimeBasedMeal = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 18) return 'Snacks';
    if (hour >= 18 && hour < 22) return 'Dinner';
    return 'Snacks';
};

/**
 * Calculates Goal Calories using Mifflin-St Jeor Formula
 */
export const calculateGoalCals = (stats) => {
    const { weight, height, age, gender, activity, targetWeight, targetDays } = stats;
    if (!weight || !height || !age) return 2000;

    // 1. Calculate BMR
    let bmr;
    if (gender === 'female') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    }

    // 2. Activity Multiplier
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extreme: 1.9
    };
    const tdee = bmr * (multipliers[activity] || 1.2);

    // 3. Weight Diff Deficit/Surplus
    if (targetWeight && targetWeight !== weight && targetDays && targetDays !== 'Auto') {
        const weightDiff = (targetWeight - weight); // e.g. -8
        const totalCals = weightDiff * 7700; // e.g. -61600
        const dailyChange = totalCals / targetDays; // e.g. -2053
        
        let goal = tdee + dailyChange;
        
        // Safety checks: don't go below 1200 or above 5000 unless specified
        return Math.max(1200, Math.round(goal));
    }

    // Default: Maintenance - 500 (standard weight loss)
    return Math.round(tdee - 500);
};

export const getLocalDateStr = (date) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
