/**
 * flayre.ai Chrome Extension - Content Script
 * 
 * Injected into chat platforms for potential DOM-based interactions
 */

console.log('flayre.ai content script loaded');

// Platform detection utilities that can be used for enhanced features
const Platforms = {
  isWhatsApp: () => window.location.hostname.includes('web.whatsapp.com'),
  isInstagram: () => window.location.hostname.includes('instagram.com'),
  isDiscord: () => window.location.hostname.includes('discord.com'),

  getCurrent: () => {
    if (Platforms.isWhatsApp()) return 'whatsapp';
    if (Platforms.isInstagram()) return 'instagram';
    if (Platforms.isDiscord()) return 'discord';
    return 'other';
  }
};

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPlatformInfo') {
    sendResponse({
      platform: Platforms.getCurrent(),
      url: window.location.href
    });
  }
  return true;
});

// Optional: Add visual indicator that extension is active
// Uncomment if desired:
// document.body.setAttribute('data-flayre-active', 'true');