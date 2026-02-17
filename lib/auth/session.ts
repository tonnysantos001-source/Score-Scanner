// lib/auth/session.ts
// Session management utilities

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = 'last_activity';

export function updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getLastActivity(): number {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return lastActivity ? parseInt(lastActivity, 10) : Date.now();
}

export function isSessionExpired(): boolean {
    const lastActivity = getLastActivity();
    const elapsed = Date.now() - lastActivity;
    return elapsed > SESSION_TIMEOUT;
}

export function clearSession() {
    // Clear all session data
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
}

export function initSessionMonitoring(onTimeout: () => void) {
    // Check every minute
    const interval = setInterval(() => {
        if (isSessionExpired()) {
            clearInterval(interval);
            onTimeout();
        }
    }, 60000); // Check every 1 minute

    // Update activity on user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, updateLastActivity);
    });

    // Initial activity
    updateLastActivity();

    return () => {
        clearInterval(interval);
        events.forEach(event => {
            document.removeEventListener(event, updateLastActivity);
        });
    };
}
