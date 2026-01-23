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
  // Check auth status
  const auth = await chrome.runtime.sendMessage({ action: 'getAuthToken' });

  if (auth.accessToken && auth.user) {
    currentUser = auth.user;
    showMainView();
    await updateUsage();
    await detectPlatform();
  } else {
    showLoginView();
  }

  // Setup event listeners
  setupEventListeners();
}

// ============================================
// View Management
// ============================================

function showView(viewName) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewName]?.classList.remove('hidden');
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
  elements.loginForm?.addEventListener('submit', handleLogin);

  // Signup link
  elements.signupLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${CONFIG.FRONTEND_URL}/login` });
  });

  // Logout
  elements.logoutBtn?.addEventListener('click', handleLogout);

  // Analyze button
  elements.analyzeBtn?.addEventListener('click', handleAnalyze);
}

// ============================================
// Authentication
// ============================================

async function handleLogin(e) {
  e.preventDefault();

  const email = elements.emailInput.value;
  const password = elements.passwordInput.value;

  if (!email || !password) return;

  elements.loginBtn.disabled = true;
  elements.loginBtn.textContent = 'Signing in...';
  elements.loginError.classList.add('hidden');

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
    await updateUsage();
    await detectPlatform();

  } catch (error) {
    elements.loginError.textContent = error.message;
    elements.loginError.classList.remove('hidden');
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Sign In';
  }
}

async function handleLogout() {
  await chrome.runtime.sendMessage({ action: 'clearAuth' });
  currentUser = null;
  showLoginView();
}

// ============================================
// Usage & Platform
// ============================================

async function updateUsage() {
  try {
    const auth = await chrome.runtime.sendMessage({ action: 'getAuthToken' });

    const response = await fetch(`${CONFIG.API_URL}/api/v1/billing/subscription`, {
      headers: { 'Authorization': `Bearer ${auth.accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const used = data.usage.analyses_used;
      const limit = data.usage.analyses_limit;
      const isPro = data.is_pro;

      elements.usageText.textContent = isPro
        ? `${used} analyses (unlimited)`
        : `${used}/${limit} analyses`;

      elements.usageFill.style.width = isPro ? '0%' : `${(used / limit) * 100}%`;

      elements.planBadge.textContent = isPro ? 'PRO' : 'FREE';
      elements.planBadge.classList.toggle('pro', isPro);
    }
  } catch (error) {
    console.error('Failed to fetch usage:', error);
  }
}

async function detectPlatform() {
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

  elements.platformIcon.textContent = platformEmojis[result.platform] || '💭';
  elements.platformName.textContent = platformNames[result.platform] || 'Ready to analyze';
}

// ============================================
// Analysis
// ============================================

async function handleAnalyze() {
  if (isAnalyzing) return;

  isAnalyzing = true;
  elements.analyzeBtn.disabled = true;
  elements.resultsContainer.classList.add('hidden');
  elements.analyzingState.classList.remove('hidden');

  try {
    // Capture screenshot
    const capture = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });

    if (!capture.success) {
      throw new Error(capture.error || 'Failed to capture screenshot');
    }

    // Get platform
    const platform = await chrome.runtime.sendMessage({ action: 'detectPlatform' });

    // Analyze
    const result = await chrome.runtime.sendMessage({
      action: 'analyzeScreenshot',
      screenshot: capture.screenshot,
      platform: platform.platform
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Display results
    displayResults(result);
    await updateUsage();

  } catch (error) {
    alert(`Analysis failed: ${error.message}`);
  } finally {
    isAnalyzing = false;
    elements.analyzeBtn.disabled = false;
    elements.analyzingState.classList.add('hidden');
  }
}

function displayResults(result) {
  // Context
  elements.contextSummary.textContent = result.context?.summary || 'Conversation analyzed';
  elements.toneTag.textContent = result.context?.tone || 'neutral';
  elements.relationshipTag.textContent = result.context?.relationship_type || 'unknown';

  // Clear previous responses
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

  elements.resultsContainer.classList.remove('hidden');
}

async function copyResponse(card, content) {
  try {
    await navigator.clipboard.writeText(content);

    // Visual feedback
    card.classList.add('copied');
    const indicator = card.querySelector('.copy-indicator');
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

  } catch (error) {
    console.error('Copy failed:', error);
  }
}
