import { createCsvBlob, createStyledButton, generateCsvString } from '@/utils/utils';

const ANKIGNB_CONTAINER_CLASS = 'ankignb-actions-container';

export function findFooterContainer(): HTMLElement | null {
  return (
    document.querySelector('.artifact-viewer-container .artifact-footer') ||
    document.querySelector('artifact-viewer .artifact-footer') ||
    document.querySelector('.artifact-footer') ||
    document.querySelector('mat-dialog-actions') ||
    document.querySelector('.mat-mdc-dialog-actions') ||
    null
  );
}

function handleDownload(data: string) {
  const blob = createCsvBlob(data);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'flashcards.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function initContentScript() {
  let currentData: string | null = null;

  function updateUI() {
    // If we don't have data stored yet, check if app-root is in the current document
    if (!currentData) {
      const dataEl =
        document.querySelector('app-root[data-app-data]') ||
        document.querySelector('[data-app-data]');
      if (dataEl) {
        const d = dataEl.getAttribute('data-app-data');
        if (d) currentData = d;
      }
    }

    if (!currentData) return;

    const footer = findFooterContainer();
    if (!footer) return;

    // Check if our container already exists
    const existingContainer = footer.querySelector<HTMLElement>(`.${ANKIGNB_CONTAINER_CLASS}`);
    if (existingContainer) {
      if (existingContainer.dataset.ankignbData === currentData) {
        return; // Up to date
      }
      existingContainer.remove();
    }

    // Verify we can parse data before creating buttons
    const csvTest = generateCsvString(currentData);
    if (!csvTest) return;

    const container = document.createElement('div');
    container.className = ANKIGNB_CONTAINER_CLASS;
    container.dataset.ankignbData = currentData;
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.marginLeft = '8px';

    // Copy Button
    const copyBtn = createStyledButton(container, 'Copy CSV', 'content_copy');
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentData) return;
      const csv = generateCsvString(currentData);
      if (csv) {
        navigator.clipboard
          .writeText(csv)
          .then(() => {
            const labelSpan = copyBtn.querySelector('.mdc-button__label');
            if (labelSpan) {
              const original = labelSpan.textContent;
              labelSpan.textContent = 'Copied!';
              setTimeout(() => {
                labelSpan.textContent = original;
              }, 1500);
            }
          })
          .catch((err) => console.error('AnkiGNB: Copy failed', err));
      }
    });

    // Download Button
    const downloadBtn = createStyledButton(container, 'Download CSV', 'download');
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentData) return;
      handleDownload(currentData);
    });

    // Coffee / Donate Button
    const donateBtn = createStyledButton(container, '', 'coffee', [], ['padding: 0 8px;']);
    donateBtn.setAttribute('title', 'Buy Creator a Coffee :)');
    donateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open('https://buymeacoffee.com/lkmss', '_blank');
    });

    // Ensure buttons have proper spacing and colors
    container.querySelectorAll('button').forEach((btn) => {
      const b = btn as HTMLElement;
      b.style.padding = '0 16px';
      b.style.color = '#ffffff';
      b.style.marginRight = '8px';
    });
    const coffeeIcon = donateBtn.querySelector('mat-icon') as HTMLElement;
    if (coffeeIcon) coffeeIcon.style.margin = '0px';

    footer.appendChild(container);
  }

  // Listen for data from iframe
  window.addEventListener('message', (event) => {
    if (
      event.data &&
      (event.data.type === 'GEMINI_NOTEBOOK_DATA' || event.data.type === 'NOTEBOOKLM_DATA') &&
      event.data.data
    ) {
      currentData =
        typeof event.data.data === 'string'
          ? event.data.data
          : JSON.stringify(event.data.data);
      updateUI();
    }
  });

  // Observe DOM for footer appearance/re-renders
  const observer = new MutationObserver(() => {
    updateUI();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    updateUI();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      updateUI();
    });
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    updateUI();
  });
}

const contentScriptEntrypoint = defineContentScript({
  matches: [
    'https://notebook.google.com/*',
    'https://notebook.google/*',
    'https://notebooklm.google.com/*',
    'https://notebooklm.google/*',
  ],
  main() {
    initContentScript();
  },
});

export default contentScriptEntrypoint;

