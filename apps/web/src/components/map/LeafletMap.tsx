import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { ILocationSnapshot } from '@/types/location.types';

export interface LeafletMapProps {
  location?: ILocationSnapshot | null;
  className?: string;
  zoom?: number;
}

export function LeafletMap({
  location,
  className = 'h-full w-full',
  zoom = 16,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const [isUserPanning, setIsUserPanning] = useState(false);

  // Capture initial config so effect doesn't re-trigger on subsequent updates
  const initialConfigRef = useRef({
    lat: location?.latitude ?? 51.505,
    lng: location?.longitude ?? -0.09,
    zoom: location ? zoom : 13,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const { lat, lng, zoom: initZoom } = initialConfigRef.current;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: initZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('dragstart', () => {
      setIsUserPanning(true);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Marker & Accuracy Circle when location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !location) return;

    const latLng: L.LatLngExpression = [location.latitude, location.longitude];

    // Create custom pulsating marker icon
    const headingRotation = location.heading != null ? `transform: rotate(${location.heading}deg);` : '';
    const markerHtml = `
      <div class="locato-marker-container">
        <div class="locato-pulse-ring"></div>
        <div class="locato-marker-pin" style="${headingRotation}">
          ${location.heading != null ? '<div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:6px solid white;position:absolute;top:-4px;left:4px;"></div>' : ''}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-locato-div-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Update or create marker
    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { icon: customIcon }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
      markerRef.current.setIcon(customIcon);
    }

    // Update or create accuracy circle
    if (location.accuracy && location.accuracy > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: location.accuracy,
          color: '#2563eb',
          weight: 1,
          opacity: 0.6,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(location.accuracy);
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    // Auto-center map if user is not manually panning
    if (!isUserPanning) {
      map.panTo(latLng, { animate: true, duration: 0.8 });
    }
  }, [location, isUserPanning]);

  // Recenter handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !location) return;
    setIsUserPanning(false);
    mapInstanceRef.current.setView([location.latitude, location.longitude], zoom, {
      animate: true,
      duration: 1,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-gray-200/80 shadow-inner dark:border-gray-800">
      <div ref={mapContainerRef} className={className} />

      {/* Recenter Button (shows when panning or always available) */}
      {location && (
        <button
          onClick={handleRecenter}
          className={`absolute bottom-6 left-6 z-[1000] flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-gray-800 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200 dark:hover:text-blue-400 ${
            isUserPanning ? 'ring-2 ring-blue-500 scale-105' : 'opacity-90 hover:opacity-100'
          }`}
          title="Recenter map on sender"
          aria-label="Recenter map on sender"
        >
          <Crosshair className={`h-4 w-4 ${isUserPanning ? 'text-blue-600 animate-spin' : ''}`} />
          <span>{isUserPanning ? 'Recenter on Sender' : 'Center'}</span>
        </button>
      )}
    </div>
  );
}
