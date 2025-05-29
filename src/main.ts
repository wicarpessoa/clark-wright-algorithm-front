import './style.css';
import * as L from 'leaflet';
import { setupMap } from './map';
import { setupUI } from './ui';
import { MapManager } from './mapManager';
import { ApiService } from './apiService';

// Create MapManager instance to handle the logistics data
const mapManager = new MapManager();

// Create ApiService instance to handle API calls
const apiService = new ApiService('http://localhost:8080/solve');

// Initialize the map
const map = setupMap('map-container');

// Initialize the UI with references to map and mapManager
setupUI(map, mapManager, apiService);