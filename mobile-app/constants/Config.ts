const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.0.105:8712';

const Config = {
  API_URL: API_URL,
  CLIENT_ID: 'meditation_mobile_app',
  CLIENT_SECRET: 'super_secret_client_key_2026',
  IS_PRODUCTION: !API_URL.includes('172.16') && !API_URL.includes('localhost'),
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export default Config;
