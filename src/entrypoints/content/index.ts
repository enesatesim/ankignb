import {
  createCsvBlob,
  createStyledButton,
  fitButtonsToFooter,
  INJECTED_ATTR,
  toTsv,
} from '@/utils/utils';

// Gemini Notebook (formerly NotebookLM). The old host now redirects to the new one; it is
// kept as a fallback in case the redirect isn't rolled out everywhere.
const MATCHES = ['https://notebook.google.com/*', 'https://notebooklm.google.com/*'];

// Keep in sync with the function injected by src/entrypoints/background/index.ts.
const MESSAGE_TYPE = 'ANKIGNB_DATA';

const FOOTER_SELECTOR = 'artifact-viewer .artifact-footer';
const ARTIFACT_FRAME_SELECTOR = 'artifact-viewer .app-frame-container iframe';

let contentScriptEntrypoint;

if (import.meta.env.FIREFOX) {
  contentScriptEntrypoint = defineContentScript({
    matches: MATCHES,
    main() {},
  });
} else {
  contentScriptEntrypoint = defineContentScript({
    matches: MATCHES,
    allFrames: true,
    main() {
      if (window.top !== window) return; // Only the top frame hosts the artifact footer.

      interface Payload {
        id: number;
        tsv: string;
        /** The artifact iframe that sent the data, when it could be identified. */
        frame: HTMLIFrameElement | null;
      }

      let payload: Payload | null = null;
      let nextId = 1;

      // Collapse labels to icons when the Studio panel is too narrow for them.
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) fitButtonsToFooter(entry.target);
      });

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (!message || typeof message !== 'object' || message.type !== MESSAGE_TYPE) return;
        if (typeof message.data !== 'string') return;

        const tsv = toTsv(message.data);
        if (!tsv) return;

        const frame = findSourceFrame(event.source);
        if (payload && payload.tsv === tsv && payload.frame === frame) return; // Duplicate post.

        payload = { id: nextId++, tsv, frame };
        render();
      });

      // Angular re-creates the footer on resize and when artifacts are switched, so re-check
      // after every DOM change (at most once per animation frame).
      let scheduled = false;
      new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          render();
        });
      }).observe(document.body, { childList: true, subtree: true });

      function findSourceFrame(source: MessageEventSource | null): HTMLIFrameElement | null {
        if (!source) return null;
        const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>(ARTIFACT_FRAME_SELECTOR));
        return frames.find((f) => f.contentWindow === source) ?? frames[0] ?? null;
      }

      function removeInjected() {
        document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) => el.remove());
      }

      function render() {
        if (!payload) return;

        // The artifact that sent the data is gone (closed, or another artifact opened).
        const stillOpen = payload.frame
          ? payload.frame.isConnected
          : !!document.querySelector(ARTIFACT_FRAME_SELECTOR);
        if (!stillOpen) {
          payload = null;
          removeInjected();
          resizeObserver.disconnect();
          return;
        }

        const footer = document.querySelector(FOOTER_SELECTOR);
        if (!footer) return;

        const id = String(payload.id);
        if (footer.querySelector(`[${INJECTED_ATTR}="${id}"]`)) return; // Already up to date.

        removeInjected();
        injectButtons(footer, payload.tsv, id);
        resizeObserver.disconnect();
        resizeObserver.observe(footer);
        fitButtonsToFooter(footer);
      }

      function injectButtons(footer: Element, tsv: string, id: string) {
        const copyBtn = createStyledButton(footer, 'Copy', 'content_copy', 'Copy cards as tab-separated text');
        copyBtn.addEventListener('click', async () => {
          await navigator.clipboard.writeText(tsv);
          flashIcon(copyBtn, 'check', 'content_copy');
        });

        const downloadBtn = createStyledButton(
          footer,
          'Download',
          'download',
          'Download cards as an Anki import file'
        );
        downloadBtn.addEventListener('click', () => handleDownload(tsv));

        const donateBtn = createStyledButton(footer, '', 'local_cafe', 'Buy the original creator a coffee');
        donateBtn.addEventListener('click', () => {
          window.open('https://buymeacoffee.com/lkmss', '_blank', 'noopener');
        });

        for (const btn of [copyBtn, downloadBtn, donateBtn]) btn.setAttribute(INJECTED_ATTR, id);
      }

      function flashIcon(button: HTMLElement, icon: string, original: string) {
        const matIcon = button.querySelector('mat-icon');
        if (!matIcon) return;
        matIcon.textContent = icon;
        setTimeout(() => (matIcon.textContent = original), 1500);
      }

      function handleDownload(tsv: string) {
        // A fresh object URL per click, so the button works more than once.
        const url = URL.createObjectURL(createCsvBlob(tsv));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flashcards.csv'; // Tab-delimited despite the name; Anki relies on it.
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    },
  });
}

export default contentScriptEntrypoint;
