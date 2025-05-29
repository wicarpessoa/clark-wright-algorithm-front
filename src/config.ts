// Environment configuration
const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Export configuration constants
export const API_URL = `${API_HOST}/solve`;
export const STRATEGIES_URL = `${API_HOST}/strategies`;

// Default map configuration
export const DEFAULT_LAT = -3.7697;  // UNIFOR coordinates
export const DEFAULT_LNG = -38.4784; // UNIFOR coordinates
export const DEFAULT_ZOOM = 15; 