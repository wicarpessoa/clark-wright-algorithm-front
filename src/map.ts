import * as L from 'leaflet';
import 'leaflet-polylinedecorator';

// Fix Leaflet icon paths
fixLeafletIconPaths();

export function setupMap(
  containerId: string, 
  defaultLat: number = -3.7681, 
  defaultLng: number = -38.4780, 
  defaultZoom: number = 18
): L.Map {
  // Create map instance
  const map = L.map(containerId).setView([defaultLat, defaultLng], defaultZoom);

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}

// Function to create custom icon for distribution center
export function createDistributionCenterIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-div-icon distribution-center-icon',
    html: '<div class="flex items-center justify-center w-full h-full">CD</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Function to create custom icon for delivery points
export function createDeliveryPointIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: 'custom-div-icon delivery-point-icon',
    html: `<div class="flex items-center justify-center w-full h-full">${index}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// Create a polyline to represent the route
export function createRouteLine(coordinates: L.LatLngExpression[]): L.Polyline {
  return L.polyline(coordinates, {
    color: '#10B981',
    weight: 5,
    opacity: 0.7,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '0, 10',
    dashOffset: '0',
    className: 'route-line'
  });
}

// Função auxiliar que cria uma rota com setas já adicionadas
export function createRouteLineWithArrows(coordinates: L.LatLngExpression[], map: L.Map): L.Polyline {
  const polyline = createRouteLine(coordinates).addTo(map);
  addArrowsToRoute(map, polyline);
  return polyline;
}

// Adiciona decoradores de seta para mostrar o sentido da rota
export function addArrowsToRoute(map: L.Map, polyline: L.Polyline): any {
  // @ts-ignore - PolylineDecorator não tem tipagem TS incluída corretamente
  const decorator = L.polylineDecorator(polyline, {
    patterns: [
      {
        offset: '10%',
        repeat: '20%',
        // @ts-ignore - Symbol também não está adequadamente tipado
        symbol: L.Symbol.arrowHead({
          pixelSize: 12,
          polygon: true,
          pathOptions: {
            fillOpacity: 0.9,
            weight: 0,
            color: '#10B981',
            fillColor: '#10B981'
          }
        })
      }
    ]
  }).addTo(map);
  
  return decorator;
}

// Add route animation
export function animateRoute(polyline: L.Polyline): void {
  const animationDuration = 1500; // 1.5 seconds
  const dashLength = 10;
  
  let startTime: number | null = null;
  
  function animate(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const dashOffset = Math.floor((progress / animationDuration) * dashLength * -1);
    
    const path = document.querySelector('.route-line path') as SVGPathElement;
    if (path) {
      path.style.strokeDashoffset = `${dashOffset}`;
    }
    
    if (progress < animationDuration) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete, remove dash array
      polyline.setStyle({
        dashArray: '0',
        opacity: 0.8
      });
    }
  }
  
  // Start animation
  requestAnimationFrame(animate);
}

// Fix Leaflet icon paths issue
function fixLeafletIconPaths() {
  // @ts-ignore - Access to defaultOptions
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}