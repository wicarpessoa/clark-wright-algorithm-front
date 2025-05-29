import * as L from 'leaflet';
import { Point } from './types';

export class MapManager {
  private distributionCenter: Point | null = null;
  private deliveryPoints: Point[] = [];
  private routeLine: L.Polyline | null = null;
  private selectedStrategy: string = '';
  
  // Get the current distribution center
  getDistributionCenter(): Point | null {
    return this.distributionCenter;
  }
  
  // Set the distribution center
  setDistributionCenter(point: Point): void {
    this.distributionCenter = point;
  }
  
  // Remove distribution center
  removeDistributionCenter(): void {
    this.distributionCenter = null;
  }
  
  // Get all delivery points
  getDeliveryPoints(): Point[] {
    return [...this.deliveryPoints];
  }
  
  // Add a delivery point
  addDeliveryPoint(point: Point): void {
    this.deliveryPoints.push(point);
  }
  
  // Remove a delivery point by ID
  removeDeliveryPoint(id: string): void {
    this.deliveryPoints = this.deliveryPoints.filter(point => point.id !== id);
  }
  
  // Reset all points
  resetPoints(): void {
    this.distributionCenter = null;
    this.deliveryPoints = [];
    if (this.routeLine) {
      this.routeLine = null;
    }
  }
  
  // Store reference to route line
  setRouteLine(line: L.Polyline): void {
    this.routeLine = line;
  }
  
  // Get route line
  getRouteLine(): L.Polyline | null {
    return this.routeLine;
  }
  
  // Set selected strategy
  setSelectedStrategy(strategyName: string): void {
    this.selectedStrategy = strategyName;
  }
  
  // Get selected strategy
  getSelectedStrategy(): string {
    return this.selectedStrategy;
  }
  
  // Check if we have enough points to calculate a route
  canCalculateRoute(): boolean {
    return (
      this.distributionCenter !== null &&
      this.deliveryPoints.length > 0 &&
      this.selectedStrategy !== ''
    );
  }
  
  // Generate route calculation payload
  generateRoutePayload(): { distributionCenter: L.LatLng, deliveryPoints: L.LatLng[], strategy: string } {
    if (!this.distributionCenter) {
      throw new Error('Distribution center is not set');
    }
    
    if (!this.selectedStrategy) {
      throw new Error('Strategy is not selected');
    }
    
    return {
      distributionCenter: this.distributionCenter.latlng,
      deliveryPoints: this.deliveryPoints.map(point => point.latlng),
      strategy: this.selectedStrategy
    };
  }
}