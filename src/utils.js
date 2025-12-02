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

export const getTimeBasedMeal = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 18) return 'Snacks';
    if (hour >= 18 && hour < 22) return 'Dinner';
    return 'Snacks';
};
