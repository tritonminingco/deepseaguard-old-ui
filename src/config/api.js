/**
 * API Configuration for DeepSeaGuard
 * Centralized configuration for all API endpoints and settings
 */

// API Configuration for DeepSeaGuard
// Centralized configuration for API endpoints and base URLs

// Backend API base URL
export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

// FathomNet API endpoints
export const FATHOMNET_ENDPOINTS = {
    searchSpecies: (query, limit = 10) =>
        `https://fathomnet.org/api/species/search?q=${encodeURIComponent(
            query
        )}&limit=${limit}`,
    getSpecies: (speciesName, limit = 5) =>
        `https://fathomnet.org/api/species/${encodeURIComponent(
            speciesName
        )}?limit=${limit}`,
    getImages: (speciesName, limit = 10) =>
        `https://fathomnet.org/api/images/search?q=${encodeURIComponent(
            speciesName
        )}&limit=${limit}`,
};

// Backend API endpoints
export const BACKEND_ENDPOINTS = {
    missions: `${API_BASE_URL}/api/missions`,
    missionById: (id) => `${API_BASE_URL}/api/missions/${id}`,
    missionExport: (id) => `${API_BASE_URL}/api/missions/${id}/export`,
    missionIngest: `${API_BASE_URL}/api/missions/ingest`,
    health: `${API_BASE_URL}/api/health`,
    fathomnet: `${API_BASE_URL}/api/fathomnet`,
};

// API request helper with error handling
export const apiRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};

// Axios configuration with base URL
import axios from "axios";

// Create axios instance with base URL
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        console.log(
            `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
    },
    (error) => {
        console.error("❌ API Request Error:", error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        console.log(
            `✅ API Response: ${response.status} ${response.config.url}`
        );
        return response;
    },
    (error) => {
        console.error(
            "❌ API Response Error:",
            error.response?.status,
            error.response?.data
        );
        return Promise.reject(error);
    }
);

export { apiClient };
