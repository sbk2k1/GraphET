chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureVisibleTab') {
    try {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Screenshot capture error:', chrome.runtime.lastError);
          sendResponse(null);
        } else {
          sendResponse(dataUrl);
        }
      });
    } catch (error) {
      console.error('Error in captureVisibleTab:', error);
      sendResponse(null);
    }
    return true; // Keep message channel open for async response
  }
});