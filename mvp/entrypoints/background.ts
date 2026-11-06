import { browser } from 'wxt/browser';
export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (tab.id !== undefined) browser.sidePanel.open({ tabId: tab.id }).catch(console.error);
  });
});
