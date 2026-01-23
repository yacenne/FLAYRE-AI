/**
 * flayre.ai Chrome Extension - Background Service Worker
 * 
 * Handles:
 * - Screenshot capture via chrome.tabs.captureVisibleTab
 * - Message passing between popup and content scripts
 * - Auth token management
 */

import { CONFIG } from '../config.js';

// ============================================
// Message Handlers
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'captureScreenshot':
      captureScreenshot().then(sendResponse);
      return true; // Keep channel open for async response

    case 'analyzeScreenshot':
      analyzeScreenshot(request.screenshot, request.platform)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getAuthToken':
      getAuthToken().then(sendResponse);
      return true;

    case 'setAuthToken':
      setAuthToken(request.token, request.user).then(sendResponse);
      return true;

    case 'clearAuth':
      clearAuth().then(sendResponse);
      return true;

    case 'detectPlatform':
      detectPlatform(sender.tab).then(sendResponse);
      return true;
  }
});

// ============================================
// Screenshot Capture
// ============================================

async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 90
    });

    // Return base64 data (remove data URL prefix for API)
    const base64Data = screenshot.split(',')[1];

    return {
      success: true,
      screenshot: base64Data,
      fullDataUrl: screenshot
    };
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// API Integration
// ============================================

async function analyzeScreenshot(screenshot, platform) {
  const token = await getAuthToken();

  if (!token.accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${CONFIG.API_URL}/api/v1/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.accessToken}`
    },
    body: JSON.stringify({
      screenshot: screenshot,
      platform: platform || null
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Analysis failed');
  }

  const result = await response.json();

  // Store last analysis
  await chrome.storage.local.set({
    [CONFIG.STORAGE_KEYS.LAST_ANALYSIS]: {
      ...result,
      timestamp: Date.now()
    }
  });

  return result;
}

// ============================================
// Auth Token Management
// ============================================

async function getAuthToken() {
  const result = await chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    CONFIG.STORAGE_KEYS.USER
  ]);

  return {
    accessToken: result[CONFIG.STORAGE_KEYS.ACCESS_TOKEN] || null,
    user: result[CONFIG.STORAGE_KEYS.USER] || null
  };
}

async function setAuthToken(token, user) {
  await chrome.storage.local.set({
    [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: token,
    [CONFIG.STORAGE_KEYS.USER]: user
  });

  return { success: true };
}

async function clearAuth() {
  await chrome.storage.local.remove([
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    CONFIG.STORAGE_KEYS.USER,
    CONFIG.STORAGE_KEYS.LAST_ANALYSIS
  ]);

  return { success: true };
}

// ============================================
// Platform Detection
// ============================================

async function detectPlatform(tab) {
  if (!tab || !tab.url) {
    return { platform: 'other' };
  }

  const url = tab.url.toLowerCase();

  for (const [key, config] of Object.entries(CONFIG.PLATFORMS)) {
    if (url.includes(config.urlPattern)) {
      return { platform: config.name };
    }
  }

  return { platform: 'other' };
}

// ============================================
// Installation Handler
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on install
    chrome.tabs.create({
      url: `${CONFIG.FRONTEND_URL}/login?source=extension`
    });
  }
});

console.log('flayre.ai background service worker loaded');