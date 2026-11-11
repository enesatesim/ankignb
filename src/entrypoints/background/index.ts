import { browser } from '@wxt-dev/webextension-polyfill/browser';

let backgroundEntrypoint;

if (import.meta.env.FIREFOX) {
  backgroundEntrypoint = defineBackground(() => {
    console.log('AnkiGNB Firefox background started');

    if (!browser.webNavigation) {
      console.error('browser.webNavigation is not available');
      return;
    }

    function injectIntoFrame(tabId: number, frameId: number) {
      browser.tabs.executeScript(tabId, {
        frameId,
        runAt: 'document_idle', // safe time to access the DOM
        code: `(() => {
          try {
            console.log(document.body.firstChild)
            }

            // se precisar observar mudanças (se o DOM for populado depois), faz um waitFor simples
            const waitFor = (selector, timeout = 3000) => new Promise((resolve) => {
              const el = document.querySelector(selector);
              if (el) return resolve({ ok: true, el: null });
              const obs = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) { obs.disconnect(); resolve({ ok: true, el: null }); }
              });
              obs.observe(document, { childList: true, subtree: true });
              setTimeout(() => { obs.disconnect(); resolve({ ok: false }); }, timeout);
            });

            // tenta esperar pelo app-root por até 2s
            return (async () => {
              const waitResult = await waitFor('app-root', 2000);
              return {
                ok: true,
                href: location.href,
                readyState: document.readyState,
                bodyExists: !!document.body,
                found,
                waitedForAppRoot: waitResult.ok,
                timestamp: Date.now(),
              };
            })();
          } catch (e) {
            return { ok: false, error: String(e) };
          }
        })();`,
      });
    }

    function handleFrameLoad(tabId: number, frameId: number) {
      const listener = (details: any) => {
        if (details.tabId === tabId && details.frameId === frameId) {
          console.log('[onCompleted] Frame loaded:', details);

          // Inject script here
          injectIntoFrame(tabId, frameId);
          // Remove listener once we handled this frame
          browser.webNavigation.onCompleted.removeListener(listener);
        }
      };

      browser.webNavigation.onCompleted.addListener(listener);
    }

    browser.webNavigation.onCommitted.addListener(async (details) => {
      if (
        details.frameId <= 0 ||
        !details.url.includes('usercontent.goog') ||
        !details.url.includes('shim.html')
      )
        return;

      const frames = await browser.webNavigation.getAllFrames({ tabId: details.tabId });
      if (!frames) return;

      const frame = frames.find((f) => f.frameId === details.frameId);

      if (!frame) return;

      console.log('[onCommitted] Frame confirmed:', frame);

      handleFrameLoad(details.tabId, details.frameId);

      // browser.tabs.executeScript(details.tabId, {
      //   frameId: details.frameId,
      //   runAt: 'document_idle',
      //   matchAboutBlank: true,
      //   code: `(() => {
      //     const startObserving = () => {
      //       const target = document.body || document.documentElement;
      //       if (!target) return;

      //       const observer = new MutationObserver((mutations) => {
      //         for (const mutation of mutations) {
      //           console.log('mutation type:', mutation.type);
      //         }
      //       });

      //       observer.observe(target, { childList: true, subtree: true });
      //       console.log('observer injected');
      //     };

      //     if (document.readyState === 'loading') {
      //       window.addEventListener('DOMContentLoaded', startObserving, { once: true });
      //     } else {
      //       startObserving();
      //     }
      //   })();`,
      // });
    });
  });
} else {
  backgroundEntrypoint = defineBackground(() => {
    console.log('AnkiGNB background started');

    if (!chrome.webNavigation) {
      console.error('chrome.webNavigation is not available');
      return;
    }

    // Gemini Notebook renders Studio artifacts in a sandboxed sub-frame. The frame loads
    // `*.scf.usercontent.goog/.../shim.html` and then shows the artifact from a `blob:https://`
    // document. Inject into both: the reader is a no-op in frames that hold no artifact data.
    const isArtifactFrame = (url: string) =>
      url.startsWith('blob:https://') || /^https:\/\/[^/]+\.usercontent\.goog\//.test(url);

    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (details.frameId <= 0 || !isArtifactFrame(details.url)) return;
      try {
        await chrome.scripting.executeScript({
          target: {
            tabId: details.tabId,
            frameIds: [details.frameId],
          },
          func: () => {
            // Keep the message type in sync with src/entrypoints/content/index.ts.
            const MESSAGE_TYPE = 'ANKIGNB_DATA';
            const SELECTOR = 'app-root[data-app-data]';
            const TIMEOUT_MS = 10000;

            const post = (el: Element) => {
              const data = el.getAttribute('data-app-data');
              if (!data) return;
              window.parent.postMessage({ type: MESSAGE_TYPE, data }, '*');
            };

            const existing = document.querySelector(SELECTOR);
            if (existing) {
              post(existing);
              return;
            }

            // The attribute may be rendered after injection: wait for it, then give up.
            const observer = new MutationObserver(() => {
              const el = document.querySelector(SELECTOR);
              if (!el) return;
              observer.disconnect();
              clearTimeout(timer);
              post(el);
            });
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['data-app-data'],
            });
            const timer = setTimeout(() => observer.disconnect(), TIMEOUT_MS);
          },
        });
      } catch (error: unknown) {
        console.error(error);
      }
    });
  });
}

export default backgroundEntrypoint;
