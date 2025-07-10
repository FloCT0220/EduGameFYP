// Session management utility functions using localStorage with expiry
export const setSession = (key: string, value: string, minutes: number) => {
  if (typeof window === 'undefined') return;
  
  const expiryTime = new Date().getTime() + (minutes * 60 * 1000);
  const sessionData = {
    value: value,
    expiry: expiryTime
  };
  
  localStorage.setItem(key, JSON.stringify(sessionData));
};

export const getSession = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const sessionData = JSON.parse(item);
    const now = new Date().getTime();
    
    // Check if session has expired
    if (now > sessionData.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return sessionData.value;
  } catch (error) {
    console.error('Error reading session:', error);
    localStorage.removeItem(key);
    return null;
  }
};

export const getSessionExpiry = (key: string): number | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const sessionData = JSON.parse(item);
    return sessionData.expiry;
  } catch {
    return null;
  }
};

export const removeSession = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

export const refreshSession = (key: string, minutes: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return;
    
    const sessionData = JSON.parse(item);
    const newExpiryTime = new Date().getTime() + (minutes * 60 * 1000);
    
    sessionData.expiry = newExpiryTime;
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error refreshing session:', error);
  }
}; 