import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  FiX,
  FiCopy,
  FiCheck,
  FiPlus,
  FiMinus,
  FiNavigation,
  FiCompass,
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

// Custom pin marker icon with animated emerald beacon
const customPinIcon = L.divIcon({
  html: `
    <div class="relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing transform transition-transform hover:scale-105">
      <div class="px-3 py-1.5 rounded-2xl bg-black text-white flex items-center gap-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.6)] border-2 border-emerald-400 ring-4 ring-emerald-500/25">
        <span class="text-xs">🅿️</span>
        <span class="text-[11px] font-black whitespace-nowrap tracking-tight text-emerald-400">Gate Entrance</span>
      </div>
      <div class="w-3 h-3 bg-black rotate-45 -mt-1.5 border-r-2 border-b-2 border-emerald-400"></div>
      <div class="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-black mt-0.5 shadow-lg animate-pulse"></div>
    </div>
  `,
  className: "custom-entrance-pin",
  iconSize: [130, 50],
  iconAnchor: [65, 50],
});

// Popular Indian City Quick Jump Presets
const CITY_SHORTCUTS = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
];

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
      if (e?.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// In-Map Tactile Zoom and Recenter Controls
function InMapControls({ position }) {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 select-none pointer-events-auto">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-xl bg-black/90 hover:bg-black text-white hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/40 backdrop-blur-md flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <FiPlus className="w-4 h-4 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-xl bg-black/90 hover:bg-black text-white hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/40 backdrop-blur-md flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <FiMinus className="w-4 h-4 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={() => map.flyTo(position, 16, { animate: true, duration: 0.8 })}
        className="w-8 h-8 rounded-xl bg-black/90 hover:bg-black text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
        title="Recenter on Entrance Pin"
        aria-label="Recenter on Entrance Pin"
      >
        <FiNavigation className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  onAddressSelect,
  className = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [appliedAddress, setAppliedAddress] = useState(false);

  const markerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const latNum = !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : 19.076;
  const lngNum = !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : 72.8777;

  const position = useMemo(() => [latNum, lngNum], [latNum, lngNum]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reverse geocode to resolve address details
  const fetchReverseAddress = useCallback(async (lat, lng) => {
    try {
      setIsResolvingAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setResolvedAddress(data.display_name);
        }
      }
    } catch (_) {
      // Non-critical, ignore geocoding service glitches
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  // Reverse geocode whenever coordinates change
  useEffect(() => {
    if (latNum && lngNum) {
      const timer = setTimeout(() => {
        fetchReverseAddress(latNum, lngNum);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [latNum, lngNum, fetchReverseAddress]);

  // Live Autocomplete Suggestions as user types
  const handleQueryChange = (val) => {
    setSearchQuery(val);
    setSearchError("");
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            val.trim()
          )}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setShowSuggestions((data || []).length > 0);
        }
      } catch (_) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select suggestion item
  const handleSelectSuggestion = (item) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
      setSearchQuery(item.display_name.split(",")[0]);
      setResolvedAddress(item.display_name);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setSearchError("");

      if (typeof onAddressSelect === "function") {
        onAddressSelect(item.display_name);
        setAppliedAddress(true);
        setTimeout(() => setAppliedAddress(false), 3000);
      }
    }
  };

  // Keyboard navigation for suggestions dropdown
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit(e);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      if (latlng && !isNaN(latlng.lat) && !isNaN(latlng.lng)) {
        onLocationChange(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
      }
    }
  };

  // Direct search submit
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError("");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!response.ok) throw new Error("Search service error");
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        if (!isNaN(newLat) && !isNaN(newLng)) {
          onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
          setResolvedAddress(item.display_name);
          setShowSuggestions(false);
          setSelectedIndex(-1);

          if (typeof onAddressSelect === "function") {
            onAddressSelect(item.display_name);
            setAppliedAddress(true);
            setTimeout(() => setAppliedAddress(false), 3000);
          }
        } else {
          setSearchError("Received invalid coordinates for this location.");
        }
      } else {
        setSearchError("Location not found. Try typing a specific landmark, road, or city.");
      }
    } catch (_) {
      setSearchError("Search temporarily unavailable. Click directly on the map to pin.");
    } finally {
      setIsSearching(false);
    }
  };

  // Device GPS Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        if (pos?.coords?.latitude && pos?.coords?.longitude) {
          onLocationChange(
            pos.coords.latitude.toFixed(6),
            pos.coords.longitude.toFixed(6)
          );
        }
      },
      (err) => {
        setIsLocating(false);
        setSearchError(
          err.code === 1
            ? "Location permission denied. Please allow location access or click on map."
            : "Could not fetch GPS location. Click directly on map to pin."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = () => {
    const coordStr = `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
    navigator.clipboard?.writeText(coordStr);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Explicitly apply the pinned reverse-geocoded address to parent form
  const handleApplyAddress = () => {
    if (resolvedAddress && typeof onAddressSelect === "function") {
      onAddressSelect(resolvedAddress);
      setAppliedAddress(true);
      setTimeout(() => setAppliedAddress(false), 3000);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Search and Quick Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div ref={searchContainerRef} className="flex-1 relative">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 pointer-events-none z-10">
              <FiSearch className="w-4 h-4 text-emerald-500" />
            </div>

            <input
              type="text"
              placeholder="Search landmark, mall, metro station, or street..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full text-xs font-semibold pl-10 pr-24 py-3 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
            />

            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleSearchSubmit}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 disabled:opacity-40 text-[11px] font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
              >
                {isSearching ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    <span>Searching</span>
                  </>
                ) : (
                  <span>Find</span>
                )}
              </button>
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-slide-up backdrop-blur-xl">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span>Suggested Locations</span>
                <span className="text-[9px] text-zinc-500 lowercase">Use ↑↓ keys to navigate</span>
              </div>
              <ul className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  return (
                    <li
                      key={item.place_id || idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className={`p-3 text-left cursor-pointer transition-colors flex items-start gap-2.5 group ${
                        isHighlighted
                          ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
                      }`}
                    >
                      <FiMapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {item.display_name.split(",")[0]}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {item.display_name.split(",").slice(1).join(",").trim()}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Select →
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Pin My GPS Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 text-xs font-bold text-zinc-900 dark:text-white transition-all shrink-0 shadow-xs cursor-pointer active:scale-95 group"
          title="Center on your current GPS position"
        >
          <FiCrosshair
            className={`w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform ${
              isLocating ? "animate-spin" : ""
            }`}
          />
          <span>{isLocating ? "Locating..." : "Pin My GPS"}</span>
        </button>
      </div>

      {/* Popular Indian City Quick Jump Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0 flex items-center gap-1">
          <FiCompass className="w-3 h-3 text-emerald-500" />
          <span>Quick City:</span>
        </span>
        {CITY_SHORTCUTS.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              onLocationChange(c.lat.toFixed(6), c.lng.toFixed(6));
              setSearchQuery(c.name);
              setSearchError("");
            }}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {c.name}
          </button>
        ))}
      </div>

      {searchError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl bg-zinc-100 dark:bg-black">
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

          <InMapControls position={position} />
        </MapContainer>

        {/* Floating Instruction Hint */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="bg-black/90 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>Click map or drag pin to exact entrance</span>
          </div>
        </div>

        {/* Floating Coordinates Badge with Click-to-Copy */}
        <div className="absolute bottom-3 right-3 z-[400] pointer-events-auto">
          <button
            type="button"
            onClick={handleCopyCoordinates}
            className="bg-black/90 hover:bg-black backdrop-blur-md text-emerald-400 text-xs font-mono font-black px-3.5 py-1.5 rounded-2xl shadow-lg border border-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
            title="Click to copy exact GPS coordinates"
          >
            {copiedCoords ? (
              <>
                <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white">Copied!</span>
              </>
            ) : (
              <>
                <FiMapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>
                  {latNum.toFixed(4)}, {lngNum.toFixed(4)}
                </span>
                <FiCopy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resolved Address Strip with 1-Tap Form Sync */}
      <div className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-bold text-zinc-500 dark:text-zinc-400 shrink-0">Pinned Address:</span>
          <p className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
            {isResolvingAddress ? (
              <span className="text-zinc-400 italic">Resolving address...</span>
            ) : resolvedAddress ? (
              resolvedAddress
            ) : (
              `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {typeof onAddressSelect === "function" && resolvedAddress && (
            <button
              type="button"
              onClick={handleApplyAddress}
              className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                appliedAddress
                  ? "bg-emerald-500 text-black border border-emerald-400 font-black"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              }`}
              title="Apply this street address to your facility details"
            >
              {appliedAddress ? (
                <>
                  <FiCheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Applied to Address ✓</span>
                </>
              ) : (
                <>
                  <FiArrowRight className="w-3 h-3" />
                  <span>Use as Facility Address</span>
                </>
              )}
            </button>
          )}

          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
            High Precision
          </span>
        </div>
      </div>
    </div>
  );
}