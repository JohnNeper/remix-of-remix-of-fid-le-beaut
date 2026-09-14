import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Fix Leaflet default marker icon URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom salon pin icon
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerMapProps {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  ville?: string;
  pays?: string;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
}

interface GeocodingResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

const POPULAR_CITIES = [
  { name: 'Douala', lat: 4.0508, lng: 9.7085, pays: 'CM' },
  { name: 'Yaoundé', lat: 3.8480, lng: 11.5021, pays: 'CM' },
  { name: 'Bafoussam', lat: 5.4778, lng: 10.4176, pays: 'CM' },
  { name: 'Garoua', lat: 9.3014, lng: 13.3977, pays: 'CM' },
  { name: 'Kribi', lat: 2.9377, lng: 9.9077, pays: 'CM' },
  { name: 'Bamenda', lat: 5.9631, lng: 10.1591, pays: 'CM' },
  { name: 'Limbe', lat: 4.0244, lng: 9.2149, pays: 'CM' },
  { name: 'Abidjan', lat: 5.3600, lng: -4.0083, pays: 'CI' },
  { name: 'Dakar', lat: 14.7167, lng: -17.4677, pays: 'SN' },
  { name: 'Libreville', lat: 0.4162, lng: 9.4673, pays: 'GA' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, pays: 'FR' },
];

export default function LocationPickerMap({
  lat,
  lng,
  address = '',
  ville = '',
  pays = 'CM',
  onLocationChange,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('');

  const defaultLat = 4.0508;
  const defaultLng = 9.7085;

  const currentLat = lat && !isNaN(lat) ? lat : defaultLat;
  const currentLng = lng && !isNaN(lng) ? lng : defaultLng;

  // Helper to move map smoothly & update marker position (Coordinates ONLY)
  const updateMapPosition = (newLat: number, newLng: number, zoom = 14, label?: string, shouldReverseGeocode = false) => {
    if (label) {
      setSelectedPlaceName(label);
    }

    // Only notify GPS coordinates to parent form without overriding manual address text
    onLocationChange({
      lat: Number(newLat.toFixed(6)),
      lng: Number(newLng.toFixed(6)),
    });

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
        duration: 1.0,
      });
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }

    if (shouldReverseGeocode) {
      reverseGeocode(newLat, newLng);
    }
  };

  // Reverse geocode via Nominatim (for marker tooltip only, without mutating parent address)
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
        const display = data.display_name?.split(',')[0] || street || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setSelectedPlaceName(data.display_name || display);
      }
    } catch (e) {
      console.warn('Reverse geocode failed:', e);
    }
  };

  // Search address using Nominatim + Photon fallback (100% Free, NO API KEY)
  const handleSearch = async (e?: React.FormEvent | React.MouseEvent, overrideQuery?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const query = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      let results: GeocodingResult[] = [];

      // 1. Primary Nominatim search (OpenStreetMap)
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`,
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

      // 2. Fallback to Photon API if Nominatim returns no results
      if (results.length === 0) {
        try {
          const photonRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
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
                  display_name: nameParts.join(', ') || query,
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
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced input typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(undefined, val);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  // Geolocate user current device position
  const handleGeolocate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        updateMapPosition(userLat, userLng, 15, 'Votre position actuelle', true);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert("Impossible d'obtenir votre position actuelle.");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Initialize Leaflet Map with 100% Free OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: lat && lng ? 14 : 12,
        zoomControl: true,
      });

      // Pure OpenStreetMap tiles (100% free, no API key, no watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      // Drag end
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updateMapPosition(position.lat, position.lng, map.getZoom(), undefined, true);
      });

      // Click on map
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        updateMapPosition(clickLat, clickLng, map.getZoom(), undefined, true);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    // Modal size recalculation
    const t1 = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
    const t2 = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync external lat/lng changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const currentMarkerPos = markerRef.current.getLatLng();
      const diffLat = Math.abs(currentMarkerPos.lat - lat);
      const diffLng = Math.abs(currentMarkerPos.lng - lng);
      if (diffLat > 0.0001 || diffLng > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1.0 });
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2.5">
      {/* Search Input Bar & Geolocate Button */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Taper un lieu, quartier, ville (ex: Douala, Akwa, Yaoundé, Bastos...)"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch();
                }
              }}
              className="pl-9 rounded-xl h-9 text-xs font-medium border-border/80 focus:border-primary bg-background"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-primary" />
            )}
          </div>

          <Button
            type="button"
            onClick={(e) => handleSearch(e)}
            disabled={isSearching || !searchQuery.trim()}
            className="rounded-xl h-9 px-3.5 font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5 shrink-0"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            <span>Rechercher</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGeolocate}
            disabled={isLocating}
            className="rounded-xl h-9 px-3 hover:bg-primary/10 hover:text-primary border-border/80 shrink-0 bg-background"
            title="Utiliser ma position GPS actuelle"
          >
            {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Navigation className="h-3.5 w-3.5 text-primary" />}
            <span className="hidden sm:inline text-xs ml-1 font-medium">Ma position</span>
          </Button>
        </div>

        {/* Quick City Shortcut Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Raccourcis :</span>
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
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 text-[11px] font-semibold rounded-lg transition-colors py-0.5 px-2 bg-background"
            >
              {city.name}
            </Badge>
          ))}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-1.5 shadow-xl space-y-1 max-h-44 overflow-y-auto z-30 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
              <span>Résultats ({searchResults.length})</span>
              <span className="text-[9px] font-normal">Cliquez pour déplacer le repère</span>
            </div>
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
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-primary/10 font-medium truncate flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Place Badge Notification */}
        {selectedPlaceName && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{selectedPlaceName}</span>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[270px] rounded-2xl overflow-hidden border border-border shadow-sm bg-muted flex items-center justify-center">
        <div ref={mapContainerRef} className="w-full h-full z-10 cursor-crosshair" />

        {/* Floating coordinate helper pill */}
        <div className="absolute bottom-2 left-2 z-20 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono border border-border/80 shadow flex items-center gap-1.5 text-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          <span>
            {lat ? Number(lat).toFixed(5) : defaultLat.toFixed(5)}, {lng ? Number(lng).toFixed(5) : defaultLng.toFixed(5)}
          </span>
          {ville && <span className="text-[10px] text-muted-foreground font-sans font-semibold">· {ville}</span>}
        </div>

        <div className="absolute top-2 right-2 z-20 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-muted-foreground border border-border/60 shadow-xs pointer-events-none hidden sm:flex items-center gap-1">
          <span>💡 Cliquez ou glissez le repère pour ajuster</span>
        </div>
      </div>
    </div>
  );
}
