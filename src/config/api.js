/**
 * API Configuration for DeepSeaGuard
 * Centralized configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  wsUrl: import.meta.env.VITE_WS_BASE_URL || "ws://localhost:3000",
  fathomnet: {
    species: "/fathomnet/species",
    search: "/fathomnet/search",
    alert: "/fathomnet/alert",
    cache: "/fathomnet/cache",
  },
  defaults: {
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 2,
  },
};

export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

/**
 * FathomNet API endpoints
 */
export const FATHOMNET_ENDPOINTS = {
  getSpecies: (species, limit = 3) =>
    buildApiUrl(
      `${API_CONFIG.fathomnet.species}/${encodeURIComponent(
        species
      )}?limit=${limit}`
    ),

  searchSpecies: (query, limit = 10) =>
    buildApiUrl(
      `${API_CONFIG.fathomnet.search}?q=${encodeURIComponent(
        query
      )}&limit=${limit}`
    ),

  triggerAlert: () => buildApiUrl(API_CONFIG.fathomnet.alert),

  getCacheStats: () => buildApiUrl(`${API_CONFIG.fathomnet.cache}/stats`),

  clearCache: () => buildApiUrl(API_CONFIG.fathomnet.cache),
};

/**
 * Generic API request with error handling and retries
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
export const apiRequest = async (url, options = {}) => {
  const config = {
    ...API_CONFIG.defaults,
    ...options,
    headers: {
      ...API_CONFIG.defaults.headers,
      ...options.headers,
    },
  };

  let lastError;

  for (let attempt = 1; attempt <= API_CONFIG.retry.attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`API request attempt ${attempt} failed:`, error.message);

      if (attempt < API_CONFIG.retry.attempts) {
        const delay =
          API_CONFIG.retry.delay *
          Math.pow(API_CONFIG.retry.backoff, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export default API_CONFIG;
