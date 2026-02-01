export default defineContentScript({
  matches: [
    'https://web.whatsapp.com/*',
    'https://www.instagram.com/*',
    'https://discord.com/*',
  ],

  main() {
    console.log('[flayre.ai] Content script loaded');

    // Add a floating button to trigger analysis
    const button = document.createElement('button');
    button.id = 'flayre-ai-button';
    button.innerHTML = '🔥';
    button.title = 'Analyze with flayre.ai';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
      z-index: 999999;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.4)';
    });

    button.addEventListener('click', () => {
      // Open extension popup
      browser.runtime.sendMessage({ action: 'openPopup' });
    });

    document.body.appendChild(button);

    console.log('[flayre.ai] Floating button added');
  },
});
