/**
 * flayre.ai Chrome Extension - Popup JavaScript
 * 
 * Main popup logic handling:
 * - Authentication state
 * - Screenshot capture trigger
 * - Results display
 * - Copy to clipboard
 */

import { CONFIG } from '../config.js';

// ============================================
// State
// ============================================

let currentUser = null;
let isAnalyzing = false;

// ============================================
// DOM Elements
// ============================================

const views = {
  loading: document.getElementById('loading-view'),
  login: document.getElementById('login-view'),
  main: document.getElementById('main-view')
};

const elements = {
  // Login
  loginForm: document.getElementById('login-form'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  loginError: document.getElementById('login-error'),
  signupLink: document.getElementById('signup-link'),

  // Main
  logoutBtn: document.getElementById('logout-btn'),
  usageText: document.getElementById('usage-text'),
  usageFill: document.getElementById('usage-fill'),
  planBadge: document.getElementById('plan-badge'),
  platformIcon: document.getElementById('platform-icon'),
  platformName: document.getElementById('platform-name'),
  analyzeBtn: document.getElementById('analyze-btn'),

  // Results
  resultsContainer: document.getElementById('results-container'),
  contextCard: document.getElementById('context-card'),
  contextSummary: document.getElementById('context-summary'),
  toneTag: document.getElementById('tone-tag'),
  relationshipTag: document.getElementById('relationship-tag'),
  responsesContainer: document.getElementById('responses-container'),

  // States
  analyzingState: document.getElementById('analyzing-state')
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Check auth status with timeout to prevent hanging
    const authPromise = chrome.runtime.sendMessage({ action: 'getAuthToken' });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 3000)
    );

    const auth = await Promise.race([authPromise, timeoutPromise]).catch(() => ({}));

    if (auth && auth.accessToken && auth.user) {
      currentUser = auth.user;
      showMainView();
      // Don't await these - let them load async
      updateUsage().catch(console.error);
      detectPlatform().catch(console.error);
    } else {
      showLoginView();
    }
  } catch (error) {
    console.error('Init error:', error);
    showLoginView();
  }

  // Setup event listeners
  setupEventListeners();
}

// ============================================
// View Management
// ============================================

function showView(viewName) {
  Object.entries(views).forEach(([name, el]) => {
    if (el) {
      el.classList.toggle('hidden', name !== viewName);
    }
  });
}

function showLoginView() {
  showView('login');
}

function showMainView() {
  showView('main');
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Login form
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }

  // Signup link
  if (elements.signupLink) {
    elements.signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: `${CONFIG.FRONTEND_URL}/login` });
    });
  }

  // Logout
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }

  // Analyze button
  if (elements.analyzeBtn) {
    elements.analyzeBtn.addEventListener('click', handleAnalyze);
  }
}

// ============================================
// Authentication
// ============================================

async function handleLogin(e) {
  e.preventDefault();

  const email = elements.emailInput?.value;
  const password = elements.passwordInput?.value;

  if (!email || !password) return;

  if (elements.loginBtn) {
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Signing in...';
  }
  if (elements.loginError) {
    elements.loginError.classList.add('hidden');
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    // Store auth
    await chrome.runtime.sendMessage({
      action: 'setAuthToken',
      token: data.access_token,
      user: data.user
    });

    currentUser = data.user;
    showMainView();

    // Load data async
    updateUsage().catch(console.error);
    detectPlatform().catch(console.error);

  } catch (error) {
    if (elements.loginError) {
      elements.loginError.textContent = error.message;
      elements.loginError.classList.remove('hidden');
    }
  } finally {
    if (elements.loginBtn) {
      elements.loginBtn.disabled = false;
      elements.loginBtn.textContent = 'Sign In';
    }
  }
}

async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ action: 'clearAuth' });
  } catch (error) {
    console.error('Logout error:', error);
  }
  currentUser = null;
  showLoginView();
}

// ============================================
// Usage & Platform
// ============================================

async function updateUsage() {
  try {
    const auth = await chrome.runtime.sendMessage({ action: 'getAuthToken' });

    if (!auth || !auth.accessToken) return;

    const response = await fetch(`${CONFIG.API_URL}/api/v1/billing/subscription`, {
      headers: { 'Authorization': `Bearer ${auth.accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const used = data.usage?.analyses_used || 0;
      const limit = data.usage?.analyses_limit || 10;
      const isPro = data.is_pro;

      if (elements.usageText) {
        elements.usageText.textContent = isPro
          ? `${used} analyses (unlimited)`
          : `${used}/${limit} analyses`;
      }

      if (elements.usageFill) {
        elements.usageFill.style.width = isPro ? '0%' : `${(used / limit) * 100}%`;
      }

      if (elements.planBadge) {
        elements.planBadge.textContent = isPro ? 'PRO' : 'FREE';
        elements.planBadge.classList.toggle('pro', isPro);
      }
    }
  } catch (error) {
    console.error('Failed to fetch usage:', error);
  }
}

async function detectPlatform() {
  try {
    const result = await chrome.runtime.sendMessage({ action: 'detectPlatform' });

    const platformEmojis = {
      whatsapp: '💬',
      instagram: '📸',
      discord: '🎮',
      other: '💭'
    };

    const platformNames = {
      whatsapp: 'WhatsApp detected',
      instagram: 'Instagram detected',
      discord: 'Discord detected',
      other: 'Ready to analyze'
    };

    const platform = result?.platform || 'other';

    if (elements.platformIcon) {
      elements.platformIcon.textContent = platformEmojis[platform] || '💭';
    }
    if (elements.platformName) {
      elements.platformName.textContent = platformNames[platform] || 'Ready to analyze';
    }
  } catch (error) {
    console.error('Platform detection error:', error);
    if (elements.platformIcon) elements.platformIcon.textContent = '💭';
    if (elements.platformName) elements.platformName.textContent = 'Ready to analyze';
  }
}

// ============================================
// Analysis
// ============================================

async function handleAnalyze() {
  if (isAnalyzing) return;

  isAnalyzing = true;
  if (elements.analyzeBtn) elements.analyzeBtn.disabled = true;
  if (elements.resultsContainer) elements.resultsContainer.classList.add('hidden');
  if (elements.analyzingState) elements.analyzingState.classList.remove('hidden');

  try {
    // Capture screenshot
    const capture = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });

    if (!capture || !capture.success) {
      throw new Error(capture?.error || 'Failed to capture screenshot');
    }

    // Get platform
    const platform = await chrome.runtime.sendMessage({ action: 'detectPlatform' });

    // Analyze
    const result = await chrome.runtime.sendMessage({
      action: 'analyzeScreenshot',
      screenshot: capture.screenshot,
      platform: platform?.platform
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Display results
    displayResults(result);
    updateUsage().catch(console.error);

  } catch (error) {
    alert(`Analysis failed: ${error.message}`);
  } finally {
    isAnalyzing = false;
    if (elements.analyzeBtn) elements.analyzeBtn.disabled = false;
    if (elements.analyzingState) elements.analyzingState.classList.add('hidden');
  }
}

function displayResults(result) {
  // Context
  if (elements.contextSummary) {
    elements.contextSummary.textContent = result.context?.summary || 'Conversation analyzed';
  }
  if (elements.toneTag) {
    elements.toneTag.textContent = result.context?.tone || 'neutral';
  }
  if (elements.relationshipTag) {
    elements.relationshipTag.textContent = result.context?.relationship_type || 'unknown';
  }

  // Clear previous responses
  if (elements.responsesContainer) {
    elements.responsesContainer.innerHTML = '';

    // Response cards
    const toneEmojis = {
      warm: '💜',
      direct: '✨',
      playful: '🎉'
    };

    result.responses?.forEach(response => {
      const card = document.createElement('div');
      card.className = 'response-card';
      card.innerHTML = `
        <div class="response-header">
          <span class="response-tone ${response.tone}">
            ${toneEmojis[response.tone] || '💬'} ${response.tone}
          </span>
          <span class="response-chars">${response.character_count} chars</span>
        </div>
        <p class="response-content">${response.content}</p>
        <div class="copy-indicator">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Click to copy
        </div>
      `;

      card.addEventListener('click', () => copyResponse(card, response.content));
      elements.responsesContainer.appendChild(card);
    });
  }

  if (elements.resultsContainer) {
    elements.resultsContainer.classList.remove('hidden');
  }
}

async function copyResponse(card, content) {
  try {
    await navigator.clipboard.writeText(content);

    // Visual feedback
    card.classList.add('copied');
    const indicator = card.querySelector('.copy-indicator');
    if (indicator) {
      indicator.classList.add('copied');
      indicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;

      setTimeout(() => {
        card.classList.remove('copied');
        indicator.classList.remove('copied');
        indicator.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Click to copy
        `;
      }, 2000);
    }

  } catch (error) {
    console.error('Copy failed:', error);
  }
}
