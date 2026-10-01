import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/webextension-polyfill'],
  srcDir: 'src',
  manifest: ({ browser }) => {
    const isFirefox = browser === 'firefox';

    return {
      name: 'AnkiGNB',
      version: '1.4.0',
      description:
        'The fastest way to export your generated Gemini Notebook flashcards and import them to your Anki decks',

      permissions: isFirefox
        ? [
            'activeTab',
            'tabs',
            'clipboardWrite',
            'webNavigation',
            'https://notebook.google.com/*',
            'https://*.usercontent.goog/*',
            'https://*.scf.usercontent.goog/*',
            '*://*.usercontent.goog/*',
            'https://*.usercontent.goog/*/shim.html*',
            '*://*.usercontent.goog/*/shim.html*',
          ]
        : ['scripting', 'clipboardWrite', 'webNavigation'],

      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: 'ankignb@lkmss.dev',
                strict_min_version: '109.0',
              },
            },
          }
        : {
            host_permissions: [
              'https://notebook.google.com/*',
              'https://*.usercontent.goog/*',
            ],
          }),
    };
  },
});
