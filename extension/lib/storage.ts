/**
 * Chrome storage utilities
 */

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'flayre_access_token',
    REFRESH_TOKEN: 'flayre_refresh_token',
    USER: 'flayre_user',
    LAST_ANALYSIS: 'flayre_last_analysis',
} as const;

export async function getStorageItem<T>(key: string): Promise<T | null> {
    const result = await browser.storage.local.get(key);
    return (result[key] !== undefined ? result[key] : null) as T | null;
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
}

export async function removeStorageItem(key: string): Promise<void> {
    await browser.storage.local.remove(key);
}

export async function clearAllStorage(): Promise<void> {
    await browser.storage.local.clear();
}
