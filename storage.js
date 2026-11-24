const PREFIX = "weatherCurrencydashboard:";

export function loadSetting(key, fallback) {
    try{
        const text = localStorage.getItem(PREFIX + key);
        return text === null ? fallback : JSON.parse(text);
    } catch (error) {
        console.error("Error loading setting:", error);
        return fallback;
    }
}

export function saveSetting(key, value) {
    try{
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
        console.log("Could not save " + key + ":", error);
    }
    
}

export function readCache(key) {
    const entry = loadSetting(key, null);
    if (entry === null || typeof entry.expires !== "number") {
        return null;
    }

    return {value: entry.value, expired: Date.now() > entry.expires};
}

export function writeCache(key, value, expiresAt) {
    saveSetting(key, {expires: expiresAt, value: value});
}