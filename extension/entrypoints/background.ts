export default defineBackground(() => {
  console.log('[flayre.ai] Background service worker initialized');

  // Open popup on click if no default popup is set (though manifest usually sets one)
  browser.action.onClicked.addListener(() => {
    browser.action.openPopup();
  });
});
