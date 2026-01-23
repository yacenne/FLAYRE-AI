/**
 * flayre.ai Chrome Extension - Configuration
 */

export const CONFIG = {
  // API Base URL - change for production
  API_URL: 'https://social-coach-api.onrender.com',
  // API_URL: 'http://localhost:8000',

  // Frontend URL
  FRONTEND_URL: 'https://flayreai.vercel.app',

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'flayre_access_token',
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
