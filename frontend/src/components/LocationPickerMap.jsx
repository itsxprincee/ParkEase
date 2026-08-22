import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiSearch,
  FiCrosshair,
} from "react-icons/fi";

// Custom pin marker icon
const customPinIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
      <div class="w-10 h-10 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.35)] border-2 border-white ring-4 ring-black/10 transform transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#05944f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="w-2 h-2 rounded-full bg-[#0a0a0a] absolute -bottom-1 ring-2 ring-white"></div>
    </div>
  `,
  className: "custom-entrance-pin",
  iconSize: [40, 48],
  iconAnchor: [20, 48],
});

// Auto pan when center coordinates change
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map event handler for click-to-pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  className = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState("");
  const markerRef = useRef(null);

  const latNum = parseFloat(latitude) || 19.076;
  const lngNum = parseFloat(longitude) || 72.8777;

  const position = useMemo(() => [latNum, lngNum], [latNum, lngNum]);

  // Handle marker drag end
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      onLocationChange(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
    }
  };

  // Search address using OpenStreetMap Nominatim Geocoding API
  const handleSearchAddress = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError("");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat).toFixed(6);
        const newLng = parseFloat(item.lon).toFixed(6);
        onLocationChange(newLat, newLng);
      } else {
        setSearchError("Location not found. Try entering a city or landmark.");
      }
    } catch (_) {
      setSearchError("Search temporarily unavailable. Click directly on the map to pin.");
    } finally {
      setIsSearching(false);
    }
  };

  // Device GPS Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onLocationChange(
          pos.coords.latitude.toFixed(6),
          pos.coords.longitude.toFixed(6)
        );
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search and Quick Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearchAddress} className="flex-1 relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#737373] pointer-events-none z-10">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search landmark, mall, metro station, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pe-input pe-input-icon-left text-xs pr-24"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] hover:bg-[#262626] disabled:opacity-40 text-white text-[11px] font-bold transition-colors z-10"
          >
            {isSearching ? "Searching..." : "Find on Map"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#e0e0e0] hover:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] transition-colors shrink-0 shadow-xs"
          title="Center on device GPS"
        >
          <FiCrosshair className={`w-4 h-4 text-[#05944f] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Locating..." : "Pin My GPS"}</span>
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-[#e11900] font-medium">{searchError}</p>
      )}

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-[#e0e0e0] shadow-inner bg-[#f0f0f0]">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapCenterController center={position} />
          <MapClickHandler
            onLocationSelect={(lat, lng) =>
              onLocationChange(lat.toFixed(6), lng.toFixed(6))
            }
          />

          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={markerRef}
            icon={customPinIcon}
          />
        </MapContainer>

        {/* Floating Instruction Hint */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#05944f] animate-dot-ping shrink-0" />
            <span>Click map or drag pin to exact entrance</span>
          </div>
        </div>

        {/* Floating Coordinates Badge */}
        <div className="absolute bottom-3 right-3 z-[400] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md text-[#0a0a0a] text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow-lg border border-[#e0e0e0] flex items-center gap-2">
            <FiMapPin className="w-3.5 h-3.5 text-[#05944f]" />
            <span>{latNum.toFixed(4)}, {lngNum.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}