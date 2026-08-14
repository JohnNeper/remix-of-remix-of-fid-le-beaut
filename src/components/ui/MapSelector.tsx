import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface MapSelectorProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

interface GeocodingResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

const POPULAR_CITIES = [
  { name: 'Douala', lat: 4.0508, lng: 9.7085 },
  { name: 'Yaoundé', lat: 3.8480, lng: 11.5021 },
  { name: 'Bafoussam', lat: 5.4778, lng: 10.4176 },
  { name: 'Garoua', lat: 9.3014, lng: 13.3977 },
  { name: 'Kribi', lat: 2.9377, lng: 9.9077 },
  { name: 'Bamenda', lat: 5.9631, lng: 10.1591 },
  { name: 'Limbe', lat: 4.0244, lng: 9.2149 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
];

export function MapSelector({ lat, lng, onChange, className }: MapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('');

  // Dynamically load Leaflet CDN assets
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

  // Helper to move map smoothly & update marker position
  const updateMapPosition = (newLat: number, newLng: number, zoom = 14, label?: string) => {
    onChange(newLat, newLng);

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      if (label) {
        const shortName = label.split(',')[0];
        markerRef.current.bindPopup(`<div style="font-weight:bold;font-size:12px;padding:2px;">📍 ${shortName}</div>`).openPopup();
      }
    }

    if (mapRef.current) {
      mapRef.current.flyTo([newLat, newLng], zoom, {
        animate: true,
        duration: 1.2,
      });
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    }

    if (label) setSelectedPlaceName(label);
  };

  // Search address or city using Nominatim + Photon fallback
  const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      let results: GeocodingResult[] = [];

      // 1. Primary Nominatim search
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          { headers: { 'Accept-Language': 'fr,en' } }
        );
        if (nomRes.ok) {
          const data = await nomRes.json();
          if (Array.isArray(data) && data.length > 0) {
            results = data.map((item: any) => ({
              place_id: item.place_id || Math.random(),
              display_name: item.display_name,
              lat: item.lat,
              lon: item.lon,
            }));
          }
        }
      } catch (err) {
        console.warn('Nominatim search warning:', err);
      }

      // 2. Fallback to Photon API if Nominatim returns no results or fails
      if (results.length === 0) {
        try {
          const photonRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`
          );
          if (photonRes.ok) {
            const photonData = await photonRes.json();
            if (photonData?.features && photonData.features.length > 0) {
              results = photonData.features.map((feat: any, idx: number) => {
                const coords = feat.geometry.coordinates; // [lng, lat]
                const props = feat.properties;
                const nameParts = [props.name, props.city, props.street, props.country].filter(Boolean);
                return {
                  place_id: `photon-${idx}`,
                  display_name: nameParts.join(', ') || searchQuery,
                  lat: String(coords[1]),
                  lon: String(coords[0]),
                };
              });
            }
          }
        } catch (err) {
          console.warn('Photon fallback search warning:', err);
        }
      }

      if (results.length > 0) {
        setSearchResults(results);
        const top = results[0];
        const newLat = parseFloat(top.lat);
        const newLng = parseFloat(top.lon);
        updateMapPosition(newLat, newLng, 14, top.display_name);
      } else {
        alert(`Aucun emplacement trouvé pour "${searchQuery}". Essayez avec le nom exact de la ville (ex: Douala, Yaoundé, Paris).`);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Geolocate user current device position
  const handleGeolocate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        updateMapPosition(userLat, userLng, 15, 'Votre position actuelle');
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Impossible d\'obtenir votre position actuelle.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

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
        setSelectedPlaceName('');
      });

      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        onChange(lat, lng);
        setSelectedPlaceName('');
      });

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    } else {
      const currentMarkerPos = markerRef.current?.getLatLng();
      if (currentMarkerPos) {
        const diffLat = Math.abs(currentMarkerPos.lat - lat);
        const diffLng = Math.abs(currentMarkerPos.lng - lng);
        if (diffLat > 0.0001 || diffLng > 0.0001) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1.0 });
        }
      }
    }
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
    <div className={`space-y-3 ${className || ''}`}>
      {/* Search Input Bar & Geolocate Button */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Taper une ville ou quartier (ex: Douala, Akwa, Yaoundé...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch();
                }
              }}
              className="pl-9 rounded-xl h-10 text-xs font-medium border-border/80 focus:border-primary"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="gradient-primary rounded-xl h-10 px-4 font-bold text-xs shadow-sm gap-1.5 shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Rechercher
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGeolocate}
            disabled={isLocating}
            className="rounded-xl h-10 px-3 hover:bg-primary/10 hover:text-primary border-border/80 shrink-0"
            title="Utiliser ma position actuelle"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Navigation className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        {/* Quick City Shortcut Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Raccourcis:</span>
          {POPULAR_CITIES.map((city) => (
            <Badge
              key={city.name}
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchQuery(city.name);
                updateMapPosition(city.lat, city.lng, 13, city.name);
              }}
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 text-[11px] font-semibold rounded-lg transition-colors py-0.5 px-2"
            >
              {city.name}
            </Badge>
          ))}
        </div>

        {/* Search Results Dropdown Suggestions if multiple */}
        {searchResults.length > 1 && (
          <div className="bg-card rounded-xl border border-border p-2 shadow-md space-y-1 max-h-36 overflow-y-auto z-20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase px-2">Suggestions trouvées:</span>
            {searchResults.map((res) => (
              <button
                key={res.place_id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const nLat = parseFloat(res.lat);
                  const nLng = parseFloat(res.lon);
                  updateMapPosition(nLat, nLng, 15, res.display_name);
                  setSearchResults([]);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-muted font-medium truncate flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Place Badge Notification */}
        {selectedPlaceName && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-in fade-in duration-200">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedPlaceName}</span>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[260px] rounded-2xl overflow-hidden border border-border shadow-sm bg-muted flex items-center justify-center">
        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
            <span className="text-sm font-medium text-muted-foreground animate-pulse">
              Chargement de la carte...
            </span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}
