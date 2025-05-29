import * as L from 'leaflet';
import { MapManager } from './mapManager';
import { ApiService } from './apiService';
import { Point, Strategy } from './types';
import { createDistributionCenterIcon, createDeliveryPointIcon, createRouteLine, animateRoute, createRouteLineWithArrows } from './map';

export function setupUI(map: L.Map, mapManager: MapManager, apiService: ApiService): void {
  // DOM Elements
  const calculateRouteBtn = document.getElementById('calculate-route-btn') as HTMLButtonElement;
  const resetMapBtn = document.getElementById('reset-map-btn') as HTMLButtonElement;
  const distributionCenterList = document.getElementById('distribution-center-list') as HTMLDivElement;
  const deliveryPointsList = document.getElementById('delivery-points-list') as HTMLDivElement;
  const strategySelect = document.getElementById('strategy-select') as HTMLSelectElement;
  const noCdMessage = document.getElementById('no-cd-message') as HTMLParagraphElement;
  const noDeliveryPointsMessage = document.getElementById('no-delivery-points-message') as HTMLParagraphElement;
  const toggleSidebarBtn = document.getElementById('toggle-sidebar') as HTMLButtonElement;
  const sidebar = document.getElementById('sidebar') as HTMLDivElement;
  const routeInfo = document.getElementById('route-info') as HTMLDivElement;
  const routeData = document.getElementById('route-data') as HTMLDivElement;
  const routeChart = document.getElementById('route-chart') as HTMLDivElement;
  
  // Map markers and lines
  let distributionCenterMarker: L.Marker | null = null;
  let deliveryPointMarkers: { [id: string]: L.Marker } = {};
  let routePolyline: L.Polyline | null = null;
  
  // Load strategies from API
  loadStrategies();
  
  async function loadStrategies(): Promise<void> {
    try {
      const strategies = await apiService.getStrategies();
      
      // Clear loading option
      strategySelect.innerHTML = '';
      
      // Add default placeholder option
      const defaultOption = document.createElement('option');
      defaultOption.value = "";
      defaultOption.textContent = "Selecione a estratégia";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      strategySelect.appendChild(defaultOption);
      
      // Add options for each strategy
      strategies.forEach(strategy => {
        const option = document.createElement('option');
        option.value = strategy.name;
        option.textContent = strategy.description;
        strategySelect.appendChild(option);
      });
      
      // Listen for strategy selection changes
      strategySelect.addEventListener('change', handleStrategyChange);
      
      // Update calculate button state
      updateCalculateButtonState();
    } catch (error) {
      console.error('Error loading strategies:', error);
      strategySelect.innerHTML = '<option value="" disabled selected>Erro ao carregar estratégias</option>';
    }
  }
  
  // Handle strategy selection change
  function handleStrategyChange(): void {
    const selectedStrategy = strategySelect.value;
    mapManager.setSelectedStrategy(selectedStrategy);
    updateCalculateButtonState();
  }
  
  // Set up map click handler
  map.on('click', handleMapClick);
  
  // Set up button handlers
  calculateRouteBtn.addEventListener('click', handleCalculateRoute);
  resetMapBtn.addEventListener('click', handleResetMap);
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  
  // Handle map clicks
  function handleMapClick(e: L.LeafletMouseEvent): void {
    const latlng = e.latlng;
    
    // If we don't have a distribution center yet, set it
    if (!mapManager.getDistributionCenter()) {
      const point: Point = {
        id: `dc-${Date.now()}`,
        latlng: latlng,
        type: 'distribution-center'
      };
      
      // Add marker to map
      distributionCenterMarker = L.marker(latlng, { 
        icon: createDistributionCenterIcon(),
        zIndexOffset: 1000
      }).addTo(map);
      
      // Add to our data model
      mapManager.setDistributionCenter(point);
      
      // Update UI
      updateDistributionCenterList();
    } 
    // Otherwise, add a delivery point
    else {
      const pointId = `dp-${Date.now()}`;
      const point: Point = {
        id: pointId,
        latlng: latlng,
        type: 'delivery-point'
      };
      
      // Add marker to map with custom icon showing the index
      const marker = L.marker(latlng, { 
        icon: createDeliveryPointIcon(mapManager.getDeliveryPoints().length + 1)
      }).addTo(map);
      
      // Store reference to marker
      deliveryPointMarkers[pointId] = marker;
      
      // Add to our data model
      mapManager.addDeliveryPoint(point);
      
      // Update UI
      updateDeliveryPointsList();
    }
    
    // Update calculate button state
    updateCalculateButtonState();
  }
  
  // Handle calculate route button click
  async function handleCalculateRoute(): Promise<void> {
    if (!mapManager.canCalculateRoute()) {
      return;
    }
    
    try {
      calculateRouteBtn.disabled = true;
      calculateRouteBtn.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Calculando...';
      
      // Hide any previous route info
      routeInfo.classList.add('hidden');
      
      const payload = mapManager.generateRoutePayload();
      const result = await apiService.calculateRoute(payload);
      
      // Remove existing route if any
      if (routePolyline) {
        map.removeLayer(routePolyline);
      }
      
      // Create route line and add to map
      const coordinates: L.LatLngExpression[] = [
        payload.distributionCenter, 
        ...result.route,  // The API returns the optimal route coordinates
        payload.distributionCenter // Return to distribution center
      ];
      
      routePolyline = createRouteLineWithArrows(coordinates, map);
      mapManager.setRouteLine(routePolyline);
      
      // Animate the route
      animateRoute(routePolyline);
      
      // Fit map bounds to include all points
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
      
      // Display route information
      displayRouteInfo(result.routeData);
      
      // Show route info section
      routeInfo.classList.remove('hidden');
      
      // Show success notification
      showNotification('Rota calculada com sucesso!', 'success');
    } catch (error) {
      console.error('Error calculating route:', error);
      showNotification('Erro ao calcular rota. Tente novamente.', 'error');
    } finally {
      calculateRouteBtn.disabled = false;
      calculateRouteBtn.innerHTML = 'Calcular Rota';
    }
  }
  
  // Display route information and chart
  function displayRouteInfo(data: any): void {
    // Display text information
    const strategyName = strategySelect.options[strategySelect.selectedIndex].text;
    let html = `
      <p><strong>Estratégia:</strong> ${strategyName}</p>
      <p><strong>Distância total:</strong> ${data.totalDistance?.toFixed(2) || 'N/A'} km</p>
      <p><strong>Tempo estimado:</strong> ${formatTime(data.totalTime || 0)}</p>
    `;
    
    routeData.innerHTML = html;
    
    // Create a simple bar chart to visualize the data
    // This is a simple implementation, in a real app you might use a charting library
    createChart(data);
  }
  
  // Create a simple chart
  function createChart(data: any): void {
    // Clear previous chart
    routeChart.innerHTML = '';
    
    // For simplicity, we're creating a basic bar chart using divs
    // In a real application, you would use a charting library like Chart.js
    
    // Create a container for the chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'h-full flex items-end justify-between';
    
    // Get the delivery points (excluding the start/end point)
    const deliveryPoints = mapManager.getDeliveryPoints();
    
    // For each point, create a bar in the chart
    deliveryPoints.forEach((point, index) => {
      // Create a bar with height proportional to something (here we use a random value)
      // In a real app, this would be actual data from the solution
      const value = data.pointData?.[index]?.value || Math.random() * 80 + 20;
      
      const bar = document.createElement('div');
      bar.className = 'bg-blue-500 w-4 hover:bg-blue-600 transition-all duration-200';
      bar.style.height = `${value}%`;
      bar.title = `Ponto ${index + 1}: ${value.toFixed(2)}`;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'flex flex-col items-center';
      barContainer.appendChild(bar);
      
      const label = document.createElement('div');
      label.className = 'text-xs mt-1';
      label.textContent = `${index + 1}`;
      barContainer.appendChild(label);
      
      chartContainer.appendChild(barContainer);
    });
    
    routeChart.appendChild(chartContainer);
  }
  
  // Format time in minutes to a readable format
  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    } else {
      return `${mins} min`;
    }
  }
  
  // Handle reset map button click
  function handleResetMap(): void {
    // Remove all markers from map
    if (distributionCenterMarker) {
      map.removeLayer(distributionCenterMarker);
      distributionCenterMarker = null;
    }
    
    Object.values(deliveryPointMarkers).forEach(marker => {
      map.removeLayer(marker);
    });
    deliveryPointMarkers = {};
    
    // Remove route if any
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
    }
    
    // Reset data model
    mapManager.resetPoints();
    
    // Hide route info
    routeInfo.classList.add('hidden');
    
    // Update UI
    updateDistributionCenterList();
    updateDeliveryPointsList();
    updateCalculateButtonState();
  }
  
  // Update distribution center list
  function updateDistributionCenterList(): void {
    const dc = mapManager.getDistributionCenter();
    
    if (dc) {
      noCdMessage.style.display = 'none';
      
      const html = `
        <div class="point-item" data-id="${dc.id}">
          <span>CD (${dc.latlng.lat.toFixed(5)}, ${dc.latlng.lng.toFixed(5)})</span>
          <button class="remove-btn" data-id="${dc.id}" data-type="dc">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      `;
      
      distributionCenterList.innerHTML = html;
      
      // Add event listener to remove button
      const removeBtn = distributionCenterList.querySelector('.remove-btn') as HTMLButtonElement;
      removeBtn.addEventListener('click', handleRemovePoint);
    } else {
      noCdMessage.style.display = 'block';
      distributionCenterList.innerHTML = '';
    }
  }
  
  // Update delivery points list
  function updateDeliveryPointsList(): void {
    const points = mapManager.getDeliveryPoints();
    
    if (points.length > 0) {
      noDeliveryPointsMessage.style.display = 'none';
      
      const html = points.map((point, index) => `
        <div class="point-item" data-id="${point.id}">
          <span>Ponto ${index + 1} (${point.latlng.lat.toFixed(5)}, ${point.latlng.lng.toFixed(5)})</span>
          <button class="remove-btn" data-id="${point.id}" data-type="dp">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      `).join('');
      
      deliveryPointsList.innerHTML = html;
      
      // Add event listeners to remove buttons
      const removeButtons = deliveryPointsList.querySelectorAll('.remove-btn');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', handleRemovePoint);
      });
    } else {
      noDeliveryPointsMessage.style.display = 'block';
      deliveryPointsList.innerHTML = '';
    }
  }
  
  // Handle remove point button click
  function handleRemovePoint(e: Event): void {
    const button = e.currentTarget as HTMLButtonElement;
    const pointId = button.dataset.id as string;
    const pointType = button.dataset.type as string;
    
    if (pointType === 'dc') {
      // Remove distribution center
      if (distributionCenterMarker) {
        map.removeLayer(distributionCenterMarker);
        distributionCenterMarker = null;
      }
      mapManager.removeDistributionCenter();
      updateDistributionCenterList();
    } else {
      // Remove delivery point
      const marker = deliveryPointMarkers[pointId];
      if (marker) {
        map.removeLayer(marker);
        delete deliveryPointMarkers[pointId];
      }
      mapManager.removeDeliveryPoint(pointId);
      
      // Update markers to reflect new indices
      updateDeliveryPointMarkers();
      
      updateDeliveryPointsList();
    }
    
    // Remove route if any
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
      
      // Hide route info
      routeInfo.classList.add('hidden');
    }
    
    updateCalculateButtonState();
  }
  
  // Update delivery point markers to reflect correct indices
  function updateDeliveryPointMarkers(): void {
    const points = mapManager.getDeliveryPoints();
    
    // Remove all existing markers
    Object.values(deliveryPointMarkers).forEach(marker => {
      map.removeLayer(marker);
    });
    
    // Recreate markers with updated indices
    deliveryPointMarkers = {};
    points.forEach((point, index) => {
      const marker = L.marker(point.latlng, { 
        icon: createDeliveryPointIcon(index + 1)
      }).addTo(map);
      
      deliveryPointMarkers[point.id] = marker;
    });
  }
  
  // Update calculate button state
  function updateCalculateButtonState(): void {
    const canCalculate = mapManager.canCalculateRoute();
    
    if (canCalculate) {
      calculateRouteBtn.disabled = false;
      calculateRouteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      calculateRouteBtn.classList.add('hover:bg-green-600');
    } else {
      calculateRouteBtn.disabled = true;
      calculateRouteBtn.classList.add('opacity-50', 'cursor-not-allowed');
      calculateRouteBtn.classList.remove('hover:bg-green-600');
    }
  }
  
  // Toggle sidebar for mobile
  function toggleSidebar(): void {
    sidebar.classList.toggle('hidden-sidebar');
  }
  
  // Show notification
  function showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-500 translate-y-0 opacity-0 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      
      // Remove from DOM after animation
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
}