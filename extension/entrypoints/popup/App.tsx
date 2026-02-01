import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { captureScreenshot, getActiveTabPlatform, copyToClipboard } from '../../lib/utils';
import type { AnalyzeResponse, UsageInfo, AIResponse } from '../../lib/types';
import './App.css';

export default function App() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUsage();

    // Cleanup timeout on unmount
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  async function loadUsage() {
    try {
      const usageData = await api.getUsage();
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const screenshot = await captureScreenshot();
      const platform = await getActiveTabPlatform();

      console.log('[Popup] Analyzing screenshot...');

      const result = await api.analyze({
        screenshot,
        platform,
      });

      console.log('[Popup] Analysis complete:', result);

      setAnalysis(result);
      await loadUsage(); // Refresh usage after analysis
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze screenshot';
      console.error('[Popup] Analysis error:', err);

      // Provide helpful error messages
      if (message.includes('401') || message.includes('Unauthorized')) {
        const webAppUrl = import.meta.env.VITE_WEB_APP_URL || 'http://localhost:3000';
        setError(`Please log in to the web app first (${webAppUrl})`);
      } else if (message.includes('Failed to fetch') || message.includes('network')) {
        setError('Cannot connect to backend. Check if backend is running.');
      } else if (message.includes('503')) {
        setError('AI service temporarily unavailable. Try again later.');
      } else {
        setError(message);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  function handleCopy(response: AIResponse) {
    copyToClipboard(response.content);
    setCopiedId(response.id);

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedId(null);
      copyTimeoutRef.current = null;
    }, 2000);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔥</span>
          <h1>flayre.ai</h1>
        </div>

        {usage && (
          <div className="usage">
            <span className="usage-count">
              {usage.analyses_remaining}/{usage.analyses_limit}
            </span>
            <span className="usage-label">analyses left</span>
          </div>
        )}
      </header>

      <main className="main">
        {error && (
          <div className="error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!analysis && !analyzing && (
          <div className="empty-state">
            <p className="empty-message">
              Click the button below to analyze the current conversation and get AI-powered response suggestions.
            </p>
            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={analyzing || (usage ? usage.analyses_remaining <= 0 : false)}
            >
              {analyzing ? 'Analyzing...' : '✨ Analyze Conversation'}
            </button>
          </div>
        )}

        {analyzing && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing conversation...</p>
          </div>
        )}

        {analysis && (
          <div className="results">
            <div className="context">
              <h3>Context</h3>
              <p className="context-summary">{analysis.context.summary}</p>
              <div className="context-meta">
                <span className="badge">{analysis.context.tone}</span>
                <span className="badge">{analysis.context.emotional_state}</span>
              </div>
            </div>

            <div className="responses">
              <h3>Suggested Responses</h3>
              {analysis.responses.map((response) => (
                <div key={response.id} className="response-card">
                  <div className="response-header">
                    <span className="response-tone">{response.tone}</span>
                    <span className="response-length">{response.character_count} chars</span>
                  </div>
                  <p className="response-content">{response.content}</p>
                  <button
                    className={`copy-button ${copiedId === response.id ? 'copied' : ''}`}
                    onClick={() => handleCopy(response)}
                  >
                    {copiedId === response.id ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              ))}
            </div>

            <button className="analyze-again-button" onClick={handleAnalyze}>
              Analyze Again
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <a href={import.meta.env.VITE_WEB_APP_URL || 'http://localhost:3000'} target="_blank" rel="noopener noreferrer">
          Manage Subscription
        </a>
      </footer>
    </div>
  );
}
