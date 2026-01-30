/**
 * flayre.ai Chrome Extension - Configuration
 */

export const CONFIG = {
  // API Base URL - Production backend on Render
  API_URL: 'https://flayre-ai.onrender.com',

  // Frontend URL - Production frontend on Vercel
  FRONTEND_URL: 'https://flayreai.vercel.app',

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'flayre_access_token',
    REFRESH_TOKEN: 'flayre_refresh_token',
    USER: 'flayre_user',
    LAST_ANALYSIS: 'flayre_last_analysis'
  },

  // Platform detection patterns
  PLATFORMS: {
    WHATSAPP: {
      urlPattern: 'web.whatsapp.com',
      name: 'whatsapp'
    },
    INSTAGRAM: {
      urlPattern: 'instagram.com',
      name: 'instagram'
    },
    DISCORD: {
      urlPattern: 'discord.com',
      name: 'discord'
    }
  }
};

export default CONFIG;
