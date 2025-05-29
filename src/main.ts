import './style.css';
import * as L from 'leaflet';
import { setupMap } from './map';
import { setupUI } from './ui';
import { MapManager } from './mapManager';
import { ApiService } from './apiService';
import { API_URL, STRATEGIES_URL, DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from './config';

// Create MapManager instance to handle the logistics data
const mapManager = new MapManager();

// Create ApiService instance to handle API calls
const apiService = new ApiService(API_URL, STRATEGIES_URL);

// Initialize the map
const map = setupMap('map-container', DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM);

// Initialize the UI with references to map and mapManager
setupUI(map, mapManager, apiService);