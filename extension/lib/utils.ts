/**
 * Screenshot capture utility
 */

import { Platform } from './types';

export async function getActiveTabPlatform(): Promise<Platform> {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url || '';

        if (url.includes('web.whatsapp.com')) {
            return Platform.WHATSAPP;
        } else if (url.includes('instagram.com')) {
            return Platform.INSTAGRAM;
        } else if (url.includes('discord.com')) {
            return Platform.DISCORD;
        }
    } catch (error) {
        console.error('Failed to get active tab platform:', error);
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
