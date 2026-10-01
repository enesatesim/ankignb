import { browser } from '@wxt-dev/webextension-polyfill/browser';

function extractAndPostNotebookData() {
  const win = window as any;
  if (win.__ankignb_injected__) {
    if (typeof win.__ankignb_extract__ === 'function') {
      win.__ankignb_extract__();
    }
    return;
  }
  win.__ankignb_injected__ = true;

  function tryExtract() {
    const dataElement =
      document.querySelector('app-root[data-app-data]') ||
      document.querySelector('[data-app-data]') ||
      document.querySelector('app-root');

    if (!dataElement) return false;

    const data = dataElement.getAttribute('data-app-data');
    if (!data || typeof data !== 'string') return false;

    window.parent.postMessage(
      {
        type: 'GEMINI_NOTEBOOK_DATA',
        data,
      },
      '*'
    );
    window.parent.postMessage(
      {
        type: 'NOTEBOOKLM_DATA',
        data,
      },
      '*'
    );
    return true;
  }

  win.__ankignb_extract__ = tryExtract;

  // 1. Immediate try
  tryExtract();

  // 2. Observe DOM mutations for data-app-data changes
  const setupObserver = () => {
    const targetNode = document.body || document.documentElement;
    if (!targetNode) return;

    const observer = new MutationObserver(() => {
      tryExtract();
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-app-data'],
    });

    // Poll periodically as a fallback
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryExtract() || attempts > 30) {
        clearInterval(interval);
      }
    }, 200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
}

let backgroundEntrypoint;

if (import.meta.env.FIREFOX) {
  backgroundEntrypoint = defineBackground(() => {
    console.log('AnkiGNB: Firefox background initialized');

    if (!browser.webNavigation) {
      console.error('AnkiGNB: browser.webNavigation not available');
      return;
    }

    const code = `(${extractAndPostNotebookData.toString()})();`;

    function injectIntoFrame(tabId: number, frameId: number) {
      browser.tabs
        .executeScript(tabId, {
          frameId,
          runAt: 'document_idle',
          code,
        })
        .catch(() => {
          // Ignore restricted frames
        });
    }

    browser.webNavigation.onCommitted.addListener((details) => {
      if (details.frameId <= 0) return;
      injectIntoFrame(details.tabId, details.frameId);
    });

    browser.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId <= 0) return;
      injectIntoFrame(details.tabId, details.frameId);
    });
  });
} else {
  backgroundEntrypoint = defineBackground(() => {
    console.log('AnkiGNB: Chrome background initialized');

    if (!chrome.webNavigation) {
      console.error('AnkiGNB: chrome.webNavigation not available');
      return;
    }

    async function injectIntoFrame(tabId: number, frameId: number) {
      try {
        await chrome.scripting.executeScript({
          target: {
            tabId,
            frameIds: [frameId],
          },
          func: extractAndPostNotebookData,
        });
      } catch (error) {
        // Ignore restricted frames
      }
    }

    chrome.webNavigation.onCommitted.addListener((details) => {
      if (details.frameId <= 0) return;
      injectIntoFrame(details.tabId, details.frameId);
    });

    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId <= 0) return;
      injectIntoFrame(details.tabId, details.frameId);
    });
  });
}

export default backgroundEntrypoint;
