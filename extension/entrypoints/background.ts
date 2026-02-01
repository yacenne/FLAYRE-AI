export default defineBackground(() => {
  console.log('[flayre.ai] Background service worker initialized');

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
      // Open extension popup
      browser.action.openPopup();
    }
  });

  // Listen for extension icon clicks
  browser.action.onClicked.addListener((tab) => {
    console.log('[flayre.ai] Extension icon clicked', tab);
  });
});
