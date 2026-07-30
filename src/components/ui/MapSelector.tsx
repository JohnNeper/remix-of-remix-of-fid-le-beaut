import React, { useEffect, useRef, useState } from 'react';

interface MapSelectorProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export function MapSelector({ lat, lng, onChange }: MapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Dynamically load Leaflet assets from CDN
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-cdn-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Map initialization and synchronization
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const initialLat = lat || 4.0508;
    const initialLng = lng || 9.7085;

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(mapRef.current);

      markerRef.current.on('dragend', () => {
        const position = markerRef.current.getLatLng();
        onChange(position.lat, position.lng);
      });

      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    } else {
      const currentMarkerPos = markerRef.current.getLatLng();
      if (currentMarkerPos.lat !== lat || currentMarkerPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng]);
      }
    }

    return () => {
      // Don't remove map on every dependency change, only on unmount
    };
  }, [leafletLoaded, lat, lng, onChange]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[250px] rounded-xl overflow-hidden border border-input shadow-sm bg-muted flex items-center justify-center">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <span className="text-sm font-medium text-muted-foreground animate-pulse">
            Chargement de la carte...
          </span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
}
