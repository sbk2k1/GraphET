let isDrawingEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const btnText = document.getElementById('btnText');
  
  // Check current state
  checkCurrentState();
  
  toggleBtn.addEventListener('click', handleToggleClick);
  
  function checkCurrentState() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) {
        updateButton();
        return;
      }

      const tab = tabs[0];
      
      // Only disable on chrome:// pages and similar
      if (tab.url && tab.url.startsWith('chrome://')) {
        btnText.textContent = 'Not available on this page';
        toggleBtn.disabled = true;
        return;
      }
      
      // Try to get current state
      chrome.tabs.sendMessage(tab.id, {action: 'getState'}, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded yet, that's fine
          isDrawingEnabled = false;
        } else if (response && response.enabled) {
          isDrawingEnabled = true;
        }
        updateButton();
      });
    });
  }
  
  function handleToggleClick() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      
      const tab = tabs[0];
      
      if (isDrawingEnabled) {
        // Disable drawing
        chrome.tabs.sendMessage(tab.id, {action: 'disable'}, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error disabling:', chrome.runtime.lastError.message);
          }
          isDrawingEnabled = false;
          updateButton();
        });
      } else {
        // Try to enable drawing
        chrome.tabs.sendMessage(tab.id, {action: 'enable'}, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not available, inject it
            console.log('Injecting content script...');
            
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }).then(() => {
              return chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ['content.css']
              });
            }).then(() => {
              // Give it a moment to initialize
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {action: 'enable'}, (response) => {
                  if (chrome.runtime.lastError) {
                    console.error('Still failed after injection:', chrome.runtime.lastError.message);
                    btnText.textContent = 'Failed to enable';
                    setTimeout(() => updateButton(), 2000);
                  } else {
                    isDrawingEnabled = true;
                    updateButton();
                  }
                });
              }, 200);
            }).catch(error => {
              console.error('Failed to inject:', error);
              btnText.textContent = 'Injection failed';
              setTimeout(() => updateButton(), 2000);
            });
          } else {
            isDrawingEnabled = true;
            updateButton();
          }
        });
      }
    });
  }
  
  function updateButton() {
    toggleBtn.disabled = false;
    
    if (isDrawingEnabled) {
      toggleBtn.classList.add('active');
      btnText.textContent = '✅ Drawing Active';
    } else {
      toggleBtn.classList.remove('active');
      btnText.textContent = '🎨 Enable Drawing';
    }
  }
});