import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'flayre.ai - AI Conversation Assistant',
    version: '3.0.0',
    description: 'Get smart response suggestions for any chat conversation with AI-powered analysis',
    permissions: ['activeTab', 'storage', 'tabs'],
    host_permissions: ['<all_urls>'],
  },
  runner: {
    chromiumArgs: [],
  },
  dev: {
    server: {
      port: 3002,
    },
  },
});
