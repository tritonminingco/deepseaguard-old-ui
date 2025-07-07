// Enhanced API client for DeepSeaGuard data services

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getMockData, 
  simulateWebSocket, 
  generateMockAUVs, 
  generateMockEnvironmentalData,
  generateMockOperationalData,
  generateMockComplianceData,
  generateMockMapData,
  generateMockAlerts
} from './mockData';

// API Configuration with environment-specific endpoints
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.deepseaguard.com/v1',
  wsUrl: process.env.REACT_APP_WS_BASE_URL || 'wss://api.deepseaguard.com/ws',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Default request timeout in milliseconds
  timeout: 30000,
  // Maximum retry attempts for failed requests
  maxRetries: 3,
  // Retry delay in milliseconds (increases with backoff)
  retryDelay: 1000
};

// Authentication token storage
let authToken = null;

/**
 * Set authentication token for API requests
 * @param {string} token - JWT or other auth token
 */
export function setAuthToken(token) {
  authToken = token;
  // Store token in localStorage for persistence across page refreshes
  if (token) {
    localStorage.setItem('deepseaguard_auth_token', token);
  } else {
    localStorage.removeItem('deepseaguard_auth_token');
  }
}

/**
 * Get stored authentication token
 * @returns {string|null} - Stored auth token
 */
export function getAuthToken() {
  if (!authToken) {
    // Try to load from localStorage
    authToken = localStorage.getItem('deepseaguard_auth_token');
  }
  return authToken;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - Authentication status
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Authenticate user with credentials
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @returns {Promise} - Promise with authentication result
 */
export async function authenticate(username, password) {
  try {
    const response = await fetchData('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (response && response.token) {
      setAuthToken(response.token);
      return { success: true, user: response.user };
    }
    
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Log out current user
 * @returns {Promise} - Promise with logout result
 */
export async function logout() {
  try {
    // Call logout endpoint if needed
    if (isAuthenticated()) {
      await fetchData('/auth/logout', {
        method: 'POST'
      });
    }
    
    // Clear token regardless of API response
    setAuthToken(null);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear token on error
    setAuthToken(null);
    return { success: true, error: error.message };
  }
}

/**
 * Enhanced fetch data from REST API with retry and timeout
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry attempt (internal)
 * @returns {Promise} - Promise with response data
 */
export async function fetchData(endpoint, options = {}, retryCount = 0) {
  // For development, always return mock data
  if (true) {
    console.log(`Using mock data for endpoint: ${endpoint}`);
    return getMockData(endpoint);
  }
  
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  // Add authentication token if available
  const headers = {
    ...API_CONFIG.defaultHeaders,
    ...(options.headers || {})
  };
  
  if (isAuthenticated()) {
    headers['Authorization'] = `Bearer ${getAuthToken()}`;
  }
  
  // Process URL parameters if provided
  let finalUrl = url;
  if (options.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    finalUrl = `${url}?${queryParams.toString()}`;
  }
  
  // Create fetch options with headers
  const fetchOptions = {
    ...options,
    headers
  };
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  fetchOptions.signal = controller.signal;
  
  try {
    const response = await fetch(finalUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        setAuthToken(null);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Handle other HTTP errors
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse response based on content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    console.error('API fetch error:', error);
    
    // Implement retry logic with exponential backoff
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.log(`Retrying request (${retryCount + 1}/${API_CONFIG.maxRetries}) after ${delay}ms`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fetchData(endpoint, options, retryCount + 1));
        }, delay);
      });
    }
    
    // For development, return mock data if API is unavailable
    console.warn('Using mock data for development');
    return getMockData(endpoint);
    
    throw error;
  }
}

/**
 * Enhanced WebSocket hook with reconnection and authentication
 * @param {string} channel - Data channel to subscribe to
 * @param {Function} onMessage - Callback for incoming messages
 * @param {Object} options - Additional options
 * @returns {Object} - WebSocket connection status and control functions
 */
export function useWebSocket(channel, onMessage, options = {}) {
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 10;
  const reconnectDelay = options.reconnectDelay || 3000;
  
  // Memoize message handler to prevent unnecessary reconnections
  const handleMessage = useCallback((data) => {
    setLastMessage(data);
    onMessage(data);
  }, [onMessage]);
  
  useEffect(() => {
    // For development, always use simulated WebSocket
    if (true) {
      console.log(`Using simulated WebSocket for channel: ${channel}`);
      const mockWs = simulateWebSocket(channel, handleMessage);
      wsRef.current = mockWs;
      setStatus('connected');
      
      return () => {
        if (mockWs && mockWs.close) {
          mockWs.close();
        }
      };
    }
    
    // Create WebSocket connection
    const connect = () => {
      try {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Build WebSocket URL with authentication if available
        let wsUrl = `${API_CONFIG.wsUrl}/${channel}`;
        const token = getAuthToken();
        if (token) {
          wsUrl += `?token=${token}`;
        }
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        setStatus('connecting');
        
        ws.onopen = () => {
          setStatus('connected');
          console.log(`WebSocket connected to channel: ${channel}`);
          // Reset reconnect attempts on successful connection
          reconnectAttemptsRef.current = 0;
          
          // Send initial subscription message if needed
          if (options.initialMessage) {
            ws.send(JSON.stringify(options.initialMessage));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleMessage(data);
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setStatus('error');
        };
        
        ws.onclose = (event) => {
          setStatus('disconnected');
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current);
            console.log(`WebSocket disconnected, attempting to reconnect in ${delay}ms... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
            
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else {
            console.error('Maximum WebSocket reconnection attempts reached');
            setStatus('failed');
            
            // For development, simulate WebSocket with mock data
            console.warn('Using simulated WebSocket for development');
            simulateWebSocket(channel, handleMessage);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setStatus('error');
        
        // For development, simulate WebSocket with mock data
        console.warn('Using simulated WebSocket for development');
        simulateWebSocket(channel, handleMessage);
      }
    };
    
    connect();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [channel, handleMessage, options.initialMessage, options.maxReconnectAttempts, options.reconnectDelay, maxReconnectAttempts, reconnectDelay]);
  
  // Send message to WebSocket
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket not connected, message not sent');
      return false;
    }
  }, []);
  
  // Force reconnection
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);
  
  return { status, lastMessage, sendMessage, reconnect };
}

/**
 * Enhanced hook for fetching historical data with time range and caching
 * @param {string} endpoint - API endpoint
 * @param {string} timeFrame - Time frame for data (e.g., 'past_hour', 'past_day')
 * @param {Object} options - Additional options
 * @returns {Object} - Data, loading state, error, and refresh function
 */
export function useHistoricalData(endpoint, timeFrame, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  
  // Cache data in memory
  const dataCache = useRef({});
  const cacheKey = `${endpoint}_${timeFrame}_${JSON.stringify(options.additionalParams || {})}`;
  
  // Fetch data function
  const fetchHistoricalData = useCallback(async (force = false) => {
    // Check cache first unless force refresh
    if (!force && dataCache.current[cacheKey] && dataCache.current[cacheKey].timestamp) {
      const cacheAge = Date.now() - dataCache.current[cacheKey].timestamp;
      const maxAge = options.cacheMaxAge || 60000; // Default 1 minute
      
      if (cacheAge < maxAge) {
        setData(dataCache.current[cacheKey].data);
        setLoading(false);
        setError(null);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // For development, always use mock data
      if (true) {
        console.log(`Using mock data for historical endpoint: ${endpoint}, timeFrame: ${timeFrame}`);
        const mockData = getMockData(endpoint, timeFrame);
        setData(mockData);
        setLastFetched(new Date());
        setError(null);
        
        // Update cache
        dataCache.current[cacheKey] = {
          data: mockData,
          timestamp: Date.now()
        };
        
        setLoading(false);
        return;
      }
      
      // Convert timeFrame to API parameters
      const timeParams = convertTimeFrame(timeFrame);
      
      // Merge with additional params if provided
      const params = {
        ...timeParams,
        ...(options.additionalParams || {})
      };
      
      // Fetch data with time parameters
      const result = await fetchData(`${endpoint}`, {
        method: 'GET',
        params
      });
      
      // Update state and cache
      setData(result);
      setLastFetched(new Date());
      setError(null);
      
      // Update cache
      dataCache.current[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err.message);
      
      // For development, use mock data
      console.warn('Using mock data for development');
      const mockData = getMockData(endpoint, timeFrame);
      setData(mockData);
      
      // Cache mock data too
      dataCache.current[cacheKey] = {
        data: mockData,
        timestamp: Date.now()
      };
    } finally {
      setLoading(false);
    }
  }, [cacheKey, endpoint, options.additionalParams, options.cacheMaxAge, timeFrame]);
  
  // Initial fetch and refresh on dependencies change
  useEffect(() => {
    fetchHistoricalData();
    
    // Set up auto-refresh if enabled
    if (options.autoRefresh && options.refreshInterval) {
      const intervalId = setInterval(() => {
        fetchHistoricalData(true); // Force refresh
      }, options.refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchHistoricalData, options.autoRefresh, options.refreshInterval]);
  
  return { 
    data, 
    loading, 
    error, 
    lastFetched,
    refresh: () => fetchHistoricalData(true) // Force refresh function
  };
}

/**
 * Convert UI timeFrame to API parameters
 * @param {string} timeFrame - UI time frame
 * @returns {Object} - API time parameters
 */
function convertTimeFrame(timeFrame) {
  const now = new Date();
  let startTime;
  
  switch (timeFrame) {
    case 'live':
      // No time range for live data
      return {};
    case 'past_hour':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'past_day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'past_week':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'past_month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      // Custom time range should be provided in additionalParams
      return {};
    default:
      // Default to past hour
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
  }
  
  return {
    start_time: startTime.toISOString(),
    end_time: now.toISOString()
  };
}

/**
 * Data transformation service for normalizing API responses
 */
export const DataTransformer = {
  /**
   * Normalize AUV data for consistent format
   * @param {Object} data - Raw AUV data
   * @returns {Object} - Normalized AUV data
   */
  normalizeAUVData(data) {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(auv => ({
      id: auv.id || auv.auvId || `unknown-${Math.random().toString(36).substr(2, 9)}`,
      name: auv.name || auv.auvName || auv.id || 'Unknown AUV',
      position: auv.position || [0, 0, 0],
      rotation: auv.rotation || [0, 0, 0],
      status: auv.status || 'unknown',
      batteryLevel: auv.batteryLevel || auv.battery || 0,
      depth: auv.depth || 0,
      mission: auv.mission || auv.missionId || 'unknown',
      lastUpdated: auv.lastUpdated || auv.timestamp || new Date().toISOString()
    }));
  },
  
  /**
   * Normalize environmental data for consistent format
   * @param {Object} data - Raw environmental data
   * @returns {Object} - Normalized environmental data
   */
  normalizeEnvironmentalData(data) {
    if (!data) return {
      sedimentDisturbance: { current: 0, threshold: 25, unit: 'mg/L', status: 'unknown', history: [] },
      waterQuality: {
        turbidity: { current: 0, threshold: 10, unit: 'NTU', status: 'unknown', history: [] },
        pH: { current: 7.0, threshold: { min: 7.0, max: 8.5 }, unit: 'pH', status: 'unknown', history: [] },
        temperature: { current: 4.0, threshold: 6, unit: '°C', status: 'unknown', history: [] },
        dissolvedOxygen: { current: 6.0, threshold: 6, unit: 'mg/L', status: 'unknown', history: [] }
      },
      speciesProximity: { count: 0, threshold: 3, status: 'unknown', species: [], history: [] }
    };
    
    return data;
  }
};

// Export data service functions for direct API access
export const AUVService = {
  async getAllAUVs() {
    const data = await fetchData('/auvs');
    return DataTransformer.normalizeAUVData(data);
  },
  
  async getAUV(id) {
    const data = await fetchData(`/auvs/${id}`);
    return DataTransformer.normalizeAUVData([data])[0];
  },
  
  async sendCommand(id, command) {
    return await fetchData(`/auvs/${id}/command`, {
      method: 'POST',
      body: JSON.stringify({ command })
    });
  }
};

export const EnvironmentalService = {
  async getCurrentMetrics() {
    const data = await fetchData('/environmental');
    return DataTransformer.normalizeEnvironmentalData(data);
  },
  
  async getHistoricalMetrics(timeFrame) {
    const data = await fetchData('/environmental/history', {
      params: convertTimeFrame(timeFrame)
    });
    return DataTransformer.normalizeEnvironmentalData(data);
  }
};

export const OperationalService = {
  async getCurrentMetrics() {
    return await fetchData('/operational');
  },
  
  async getHistoricalMetrics(timeFrame) {
    return await fetchData('/operational/history', {
      params: convertTimeFrame(timeFrame)
    });
  },
  
  async getLogs(count = 10) {
    return await fetchData('/operational/logs', {
      params: { count }
    });
  }
};

export const ComplianceService = {
  async getStatus() {
    return await fetchData('/compliance');
  },
  
  async getStandards() {
    return await fetchData('/compliance/standards');
  },
  
  async getReportingTimeline() {
    return await fetchData('/compliance/reporting');
  },
  
  async generateReport(type) {
    return await fetchData('/compliance/report', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }
};

export const MapService = {
  async getBathymetricData(bounds) {
    return await fetchData('/map/bathymetry', {
      params: bounds
    });
  },
  
  async getZoneBoundaries() {
    return await fetchData('/map/zones');
  },
  
  async getSensitiveAreas() {
    return await fetchData('/map/sensitive-areas');
  },
  
  async getPlumeData() {
    return await fetchData('/map/plumes');
  }
};

export const AlertService = {
  async getAlerts(count = 10) {
    return await fetchData('/alerts', {
      params: { count }
    });
  },
  
  async acknowledgeAlert(id) {
    return await fetchData(`/alerts/${id}/acknowledge`, {
      method: 'POST'
    });
  },
  
  async resolveAlert(id, resolution) {
    return await fetchData(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution })
    });
  }
};
