import Config from '../constants/Config';

const apiRequest = async (endpoint: string, options: any = {}) => {
  const baseUrl = Config.API_URL.endsWith('/') ? Config.API_URL.slice(0, -1) : Config.API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;
  console.log(`[API] Chamando: ${url}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de limite

  const headers = {
    'Content-Type': 'application/json',
    'x-client-id': Config.CLIENT_ID,
    'x-client-secret': Config.CLIENT_SECRET,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const authService = {
  login: (username: string, password: string) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  register: (username: string, password: string, email?: string) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
  },
  googleLogin: (idToken: string) => {
    return apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }
};

export default apiRequest;
