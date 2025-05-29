import * as L from 'leaflet';
import { Strategy } from './types';

export class ApiService {
  private apiUrl: string;
  private strategiesUrl: string;
  
  constructor(apiUrl: string, strategiesUrl?: string) {
    this.apiUrl = apiUrl;
    this.strategiesUrl = strategiesUrl || apiUrl.replace('/solve', '/strategies');
  }
  
  // Fetch available strategies
  async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await fetch(this.strategiesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching strategies:', error);
      // Return default strategies if API fails
      return [
        { name: 'clarkwright', description: 'Algoritmo de Clark & Wright - Economias' },
        { name: 'nearestneighbor', description: 'Algoritmo do Vizinho Mais Próximo' }
      ];
    }
  }
  
  // Calculate route via API
  async calculateRoute(payload: { 
    distributionCenter: L.LatLng, 
    deliveryPoints: L.LatLng[],
    strategy: string
  }): Promise<{route: L.LatLng[], routeData: any}> {
    try {
      // Format the payload for the API
      const apiPayload = {
        distributionCenter: {
          lat: payload.distributionCenter.lat,
          lng: payload.distributionCenter.lng
        },
        deliveryPoints: payload.deliveryPoints.map(point => ({
          lat: point.lat,
          lng: point.lng
        })),
        strategy: payload.strategy
      };
      
      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert response data to LatLng objects
      const route = data.route.map((point: { lat: number, lng: number }) => 
        L.latLng(point.lat, point.lng)
      );
      
      return {
        route: route,
        routeData: data.routeData || {}
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      
      // For development/testing, return mock data if API fails
      console.warn('Using mock route data due to API error');
      return this.getMockRouteResponse(payload);
    }
  }
  
  // Generate mock route response for testing without backend
  private getMockRouteResponse(payload: { 
    distributionCenter: L.LatLng, 
    deliveryPoints: L.LatLng[],
    strategy: string
  }): {route: L.LatLng[], routeData: any} {
    // Simply return the delivery points in the same order
    // In a real app, this would be replaced by the API response
    return {
      route: [...payload.deliveryPoints],
      routeData: {
        totalDistance: 100,
        totalTime: 60,
        strategy: payload.strategy
      }
    };
  }
}