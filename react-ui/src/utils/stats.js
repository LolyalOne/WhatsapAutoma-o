const STORAGE_KEY = 'wpp_saas_stats';

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const getStats = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDate();
    
    let stats = saved ? JSON.parse(saved) : { date: today, sent: 0, failed: 0 };

    // Reseta se for outro dia
    if (stats.date !== today) {
        stats = { date: today, sent: 0, failed: 0 };
        saveStats(stats);
    }
    
    return stats;
};

const saveStats = (stats) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const incrementSent = () => {
    const stats = getStats();
    stats.sent += 1;
    saveStats(stats);
    return stats;
};

export const incrementFailed = () => {
    const stats = getStats();
    stats.failed += 1;
    saveStats(stats);
    return stats;
};
