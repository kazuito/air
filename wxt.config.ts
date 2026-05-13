import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['webNavigation', 'tabs', 'scripting'],
    host_permissions: ['*://ai.router/*', 'https://chatgpt.com/*'],
  },
});
