/**
 * Performance Configuration for DeepSeaGuard
 *
 * This file contains optimizations and configurations to improve
 * application performance, especially for the FathomNet integration.
 */

// Cache configuration for API responses
export const CACHE_CONFIG = {
  // FathomNet species data cache duration (30 minutes)
  SPECIES_DATA_TTL: 30 * 60 * 1000,

  // Search suggestions cache duration (10 minutes)
  SEARCH_CACHE_TTL: 10 * 60 * 1000,

  // Maximum cache size (number of entries)
  MAX_CACHE_SIZE: 100,

  // Enable/disable caching
  ENABLE_CACHING: true,
};

// Image optimization settings
export const IMAGE_CONFIG = {
  // Lazy loading configuration
  LAZY_LOADING: {
    enabled: true,
    threshold: 0.1, // Load when 10% visible
    rootMargin: "50px",
  },

  // Image quality settings for FathomNet images
  QUALITY: {
    thumbnail: 0.7,
    preview: 0.8,
    full: 0.9,
  },

  // Maximum image dimensions
  MAX_DIMENSIONS: {
    thumbnail: { width: 150, height: 150 },
    preview: { width: 400, height: 400 },
    full: { width: 1200, height: 1200 },
  },
};

// Debounce timings for different operations
export const DEBOUNCE_CONFIG = {
  // Search input debounce (ms)
  SEARCH_INPUT: 300,

  // API request debounce (ms)
  API_REQUEST: 500,

  // Window resize debounce (ms)
  WINDOW_RESIZE: 150,

  // Auto-save debounce (ms)
  AUTO_SAVE: 2000,
};

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  // Reconnection settings
  RECONNECT: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000, // Initial delay in ms
    backoffFactor: 1.5, // Exponential backoff
  },

  // Heartbeat/ping settings
  HEARTBEAT: {
    enabled: true,
    interval: 30000, // 30 seconds
  },

  // Message queue settings
  MESSAGE_QUEUE: {
    maxSize: 50,
    flushInterval: 100, // ms
  },
};

// Data processing thresholds
export const DATA_CONFIG = {
  // Pagination settings
  PAGINATION: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Batch processing
  BATCH_SIZE: {
    alerts: 10,
    species: 5,
    images: 8,
  },

  // Memory management
  MEMORY: {
    maxAlerts: 200,
    maxSpeciesCache: 50,
    maxImageCache: 100,
  },
};

// Performance monitoring
export const MONITORING_CONFIG = {
  // Enable performance tracking
  ENABLE_TRACKING: process.env.NODE_ENV === "development",

  // Metrics to track
  METRICS: {
    apiResponseTime: true,
    componentRenderTime: true,
    memoryUsage: true,
    errorRate: true,
  },

  // Sampling rate (0.0 to 1.0)
  SAMPLE_RATE: 0.1,
};

/**
 * Create a performance-optimized cache with TTL support
 */
export class TTLCache {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value and timer
    this.cache.set(key, value);

    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return this;
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global performance cache instance
export const performanceCache = new TTLCache(
  CACHE_CONFIG.MAX_CACHE_SIZE,
  CACHE_CONFIG.SPECIES_DATA_TTL
);
