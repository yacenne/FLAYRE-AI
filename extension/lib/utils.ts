/**
 * Screenshot capture utility
 */

import { Platform } from './types';

export function detectPlatform(): Platform {
    const url = window.location.href;

    if (url.includes('web.whatsapp.com')) {
        return Platform.WHATSAPP;
    } else if (url.includes('instagram.com')) {
        return Platform.INSTAGRAM;
    } else if (url.includes('discord.com')) {
        return Platform.DISCORD;
    }

    return Platform.UNKNOWN;
}

export async function captureScreenshot(): Promise<string> {
    return new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            if (!activeTab?.id) {
                reject(new Error('No active tab found'));
                return;
            }

            browser.tabs.captureVisibleTab(
                activeTab.windowId,
                { format: 'png' },
                (dataUrl) => {
                    if (browser.runtime.lastError) {
                        reject(new Error(browser.runtime.lastError.message));
                    } else {
                        // Remove data URL prefix to get base64
                        const base64 = dataUrl.split(',')[1];
                        resolve(base64);
                    }
                }
            );
        });
    });
}

export function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch((error) => {
        console.error('Failed to copy to clipboard:', error);
    });
}
