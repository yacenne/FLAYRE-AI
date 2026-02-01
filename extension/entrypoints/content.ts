export default defineContentScript({
  matches: [
    'https://web.whatsapp.com/*',
    'https://www.instagram.com/*',
    'https://discord.com/*',
  ],

  main() {
    console.log('[flayre.ai] Content script loaded');
    // Floating button removed as per user request
  },
});
