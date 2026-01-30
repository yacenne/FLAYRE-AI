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
      setAuthToken(request.token, request.refreshToken, request.user).then(sendResponse);
      return true;

    case 'refreshToken':
      refreshAuthToken().then(sendResponse).catch(err => sendResponse({ error: err.message }));
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

    // Check if tab URL is capturable (not chrome://, edge://, etc.)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      throw new Error('Cannot capture this page. Please navigate to a website.');
    }

    // Get the current window ID for captureVisibleTab
    const currentWindow = await chrome.windows.getCurrent();

    if (!currentWindow || !currentWindow.id) {
      throw new Error('Could not get current window');
    }

    // Use windowId explicitly instead of null
    const screenshot = await chrome.tabs.captureVisibleTab(currentWindow.id, {
      format: 'png',
      quality: 90
    });

    if (!screenshot) {
      throw new Error('Screenshot capture returned empty result');
    }

    // Return base64 data (remove data URL prefix for API)
    const base64Data = screenshot.split(',')[1];

    if (!base64Data) {
      throw new Error('Failed to extract base64 data from screenshot');
    }

    return {
      success: true,
      screenshot: base64Data,
      fullDataUrl: screenshot
    };
  } catch (error) {
    console.error('Screenshot capture failed:', error);

    // Provide more specific error messages
    let errorMessage = error.message;
    if (errorMessage.includes('Permission denied') || errorMessage.includes('Cannot access')) {
      errorMessage = 'Permission denied. Please refresh the page and try again.';
    } else if (errorMessage.includes('No tab')) {
      errorMessage = 'No active tab found. Please open a chat conversation first.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

// ============================================
// API Integration
// ============================================

async function analyzeScreenshot(screenshot, platform) {
  let token = await getAuthToken();

  console.log('[flayre.ai] Token check:', {
    hasToken: !!token.accessToken,
    tokenPreview: token.accessToken ? token.accessToken.substring(0, 50) + '...' : 'none'
  });

  if (!token.accessToken) {
    throw new Error('Not authenticated');
  }

  console.log('[flayre.ai] Calling analyze API at:', `${CONFIG.API_URL}/api/v1/analyze`);

  let response = await fetch(`${CONFIG.API_URL}/api/v1/analyze`, {
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

  console.log('[flayre.ai] Response status:', response.status);

  // If token expired, try refreshing and retrying once
  if (response.status === 401) {
    console.log('[flayre.ai] Token expired, attempting refresh...');

    try {
      const refreshResult = await refreshAuthToken();
      token = refreshResult;

      // Retry the request with new token
      response = await fetch(`${CONFIG.API_URL}/api/v1/analyze`, {
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

      console.log('[flayre.ai] Retry response status:', response.status);
    } catch (refreshError) {
      console.error('[flayre.ai] Token refresh failed:', refreshError);
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    let errorMessage = 'Analysis failed';

    try {
      const error = await response.json();
      console.error('[flayre.ai] Error response:', JSON.stringify(error));
      // Extract error message from various possible formats
      errorMessage = error.detail || error.message || error.error || JSON.stringify(error);
    } catch (jsonError) {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        console.error('[flayre.ai] Error text:', errorText);
        errorMessage = errorText || `Server error: ${response.status}`;
      } catch (textError) {
        errorMessage = `Server error: ${response.status}`;
      }
    }

    throw new Error(errorMessage);
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
    CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
    CONFIG.STORAGE_KEYS.USER
  ]);

  return {
    accessToken: result[CONFIG.STORAGE_KEYS.ACCESS_TOKEN] || null,
    refreshToken: result[CONFIG.STORAGE_KEYS.REFRESH_TOKEN] || null,
    user: result[CONFIG.STORAGE_KEYS.USER] || null
  };
}

async function setAuthToken(token, refreshToken, user) {
  await chrome.storage.local.set({
    [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: token,
    [CONFIG.STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
    [CONFIG.STORAGE_KEYS.USER]: user
  });

  return { success: true };
}

async function refreshAuthToken() {
  try {
    const { refreshToken } = await getAuthToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('[flayre.ai] Refreshing access token...');

    const response = await fetch(`${CONFIG.API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update stored tokens
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: data.access_token,
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN]: data.refresh_token,
      [CONFIG.STORAGE_KEYS.USER]: data.user
    });

    console.log('[flayre.ai] Token refreshed successfully');

    return {
      success: true,
      accessToken: data.access_token,
      user: data.user
    };
  } catch (error) {
    console.error('[flayre.ai] Token refresh error:', error);
    // Clear invalid tokens
    await clearAuth();
    throw error;
  }
}

async function clearAuth() {
  await chrome.storage.local.remove([
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
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