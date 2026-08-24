import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiNavigation,
  FiMapPin,
  FiZap,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiCompass,
  FiPlus,
  FiMinus,
  FiCrosshair,
  FiLayers,
} from "react-icons/fi";
import Badge from "./Badge";
import Button from "./Button";

// Helper component to auto-pan map when coordinates or active selection changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Glassmorphism Zoom & Map Controls Widget
function CustomMapControls({ onCenterMe, hasUserCoords, onFitAll }) {
  const map = useMap();

  return (
    <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] border border-zinc-200/80 dark:border-zinc-700/80">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-all active:scale-90"
        title="Zoom In"
      >
        <FiPlus className="w-4 h-4" />
      </button>
      <div className="w-5 h-px bg-zinc-200 dark:bg-zinc-700" />
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-all active:scale-90"
        title="Zoom Out"
      >
        <FiMinus className="w-4 h-4" />
      </button>
      {hasUserCoords && (
        <>
          <div className="w-5 h-px bg-zinc-200 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={onCenterMe}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all active:scale-90"
            title="Center on My GPS Location"
          >
            <FiCrosshair className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function ParkingMapView({
  parkingLocations = [],
  userCoords = null,
  onLocateUser,
  isLocating = false,
  onBookParking,
  onViewDetails,
}) {
  const [selectedParking, setSelectedParking] = useState(null);

  // Default center: User location -> Nearest parking -> Default city center
  const defaultCenter = useMemo(() => {
    if (userCoords && userCoords.lat && userCoords.lng) {
      return [Number(userCoords.lat), Number(userCoords.lng)];
    }
    if (parkingLocations.length > 0 && parkingLocations[0].latitude) {
      return [
        Number(parkingLocations[0].latitude),
        Number(parkingLocations[0].longitude),
      ];
    }
    return [19.0864, 72.8890];
  }, [userCoords, parkingLocations]);

  // Find the nearest facility id if user coordinates exist
  const nearestParkingId = useMemo(() => {
    if (!userCoords || parkingLocations.length === 0) return null;
    let minDistance = Infinity;
    let nearestId = null;

    parkingLocations.forEach((p) => {
      if (p.latitude && p.longitude) {
        const R = 6371;
        const dLat = ((Number(p.latitude) - Number(userCoords.lat)) * Math.PI) / 180;
        const dLon = ((Number(p.longitude) - Number(userCoords.lng)) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((Number(userCoords.lat) * Math.PI) / 180) *
            Math.cos((Number(p.latitude) * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist < minDistance) {
          minDistance = dist;
          nearestId = p.id;
        }
      }
    });

    return nearestId;
  }, [userCoords, parkingLocations]);

  // Create ultra-modern interactive map pins
  const createParkingIcon = (parking) => {
    const isNearest = parking.id === nearestParkingId;
    const isFree = (parking.hourly_rate ?? -1) === 0;
    const isSelected = selectedParking?.id === parking.id;
    const rateLabel = isFree ? "FREE" : `₹${parking.hourly_rate ?? 50}/hr`;
    const availableSlots = parking.available_slots ?? parking.available ?? 8;

    const iconHtml = `
      <div class="relative flex flex-col items-center cursor-pointer select-none transform transition-all duration-200 ${
        isSelected
          ? "scale-115 -translate-y-2 z-50"
          : isNearest
          ? "scale-105 -translate-y-1 z-40 hover:scale-110"
          : "scale-100 hover:scale-105 z-20"
      }">
        ${
          isNearest
            ? `<div class="mb-0.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 animate-pulse">
                <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Nearest</span>
              </div>`
            : ""
        }
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.18)] border-2 transition-all backdrop-blur-md ${
          isSelected
            ? "bg-zinc-950 text-white border-blue-500 ring-4 ring-blue-500/25 shadow-blue-500/20"
            : isNearest
            ? "bg-zinc-950 text-white border-emerald-500 ring-4 ring-emerald-500/20"
            : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50"
        }">
          <div class="w-5 h-5 rounded-lg ${
            parking.has_ev ? "bg-amber-400 text-zinc-950" : isSelected || isNearest ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-900"
          } flex items-center justify-center text-xs font-black shrink-0">
            ${parking.has_ev ? "⚡" : "🅿️"}
          </div>
          <div class="flex flex-col leading-tight text-left">
            <span class="text-[11px] font-black tracking-tight whitespace-nowrap">${rateLabel}</span>
            <span class="text-[9px] font-bold ${
              isSelected || isNearest ? "text-zinc-300" : "text-emerald-600"
            } whitespace-nowrap">${availableSlots} spots</span>
          </div>
        </div>
        <!-- Pointer Tip -->
        <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 shadow-sm ${
          isSelected
            ? "bg-zinc-950 border-blue-500"
            : isNearest
            ? "bg-zinc-950 border-emerald-500"
            : "bg-white border-zinc-200"
        }"></div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "custom-parking-marker",
      iconSize: [110, 52],
      iconAnchor: [55, 52],
      popupAnchor: [0, -54],
    });
  };

  // User location marker icon with pulsating GPS radar
  const userIcon = useMemo(() => {
    const userHtml = `
      <div class="relative flex items-center justify-center pointer-events-none" style="width:44px; height:44px;">
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-pe-radar"></div>
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/20"></div>
        <div class="relative w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-[0_4px_12px_rgba(37,99,235,0.6)] flex items-center justify-center text-white text-xs font-black">
          🚗
        </div>
      </div>
    `;
    return L.divIcon({
      html: userHtml,
      className: "custom-user-marker",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
    });
  }, []);

  return (
    <div className="relative isolate z-0 w-full h-[540px] lg:h-[620px] rounded-3xl overflow-hidden bg-neutral-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      {/* FLOATING MAP TOP BAR CONTROLS */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Find Nearest Button */}
          <button
            type="button"
            onClick={onLocateUser}
            disabled={isLocating}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 ${
              userCoords
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-zinc-950/20"
                : "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-900 dark:hover:border-white"
            }`}
          >
            <FiCompass className={`w-4 h-4 ${isLocating ? "animate-spin text-blue-500" : userCoords ? "text-emerald-400" : "text-blue-500"}`} />
            <span>{isLocating ? "Detecting GPS..." : userCoords ? "GPS Active" : "Find Nearest"}</span>
          </button>

          {/* Live Lots Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-white text-xs font-bold border border-zinc-200/80 dark:border-zinc-700/80 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{parkingLocations.length} Lots Live</span>
          </div>
        </div>

        {/* Jump to Nearest Quick Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {nearestParkingId && (
            <button
              type="button"
              onClick={() => {
                const nearest = parkingLocations.find((p) => p.id === nearestParkingId);
                if (nearest) setSelectedParking(nearest);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md hover:shadow-blue-500/25 transition-all active:scale-95"
            >
              <span>⚡ Jump to Nearest</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <MapContainer
        center={defaultCenter}
        zoom={userCoords ? 14 : 12}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapRecenter
          center={
            selectedParking && selectedParking.latitude
              ? [Number(selectedParking.latitude), Number(selectedParking.longitude)]
              : defaultCenter
          }
          zoom={selectedParking ? 15 : userCoords ? 14 : 12}
        />

        {/* Custom Map Zoom and Center Controls */}
        <CustomMapControls
          hasUserCoords={Boolean(userCoords?.lat && userCoords?.lng)}
          onCenterMe={() => {
            if (userCoords?.lat && userCoords?.lng) {
              setSelectedParking(null);
            }
          }}
        />

        {/* Clean CartoDB Positron / OSM Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* USER LOCATION MARKER */}
        {userCoords && userCoords.lat && (
          <>
            <Marker
              position={[Number(userCoords.lat), Number(userCoords.lng)]}
              icon={userIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1 text-center font-sans">
                  <p className="text-xs font-extrabold text-slate-900">Your Current Location</p>
                  <p className="text-[10px] text-slate-500">Searching nearest parking within radius</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[Number(userCoords.lat), Number(userCoords.lng)]}
              radius={800}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 1.5,
              }}
            />
          </>
        )}

        {/* PARKING MARKERS */}
        {parkingLocations.map((parking) => {
          if (!parking.latitude || !parking.longitude) return null;
          const isNearest = parking.id === nearestParkingId;

          return (
            <Marker
              key={parking.id}
              position={[Number(parking.latitude), Number(parking.longitude)]}
              icon={createParkingIcon(parking)}
              eventHandlers={{
                click: () => setSelectedParking(parking),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 max-w-[220px] font-sans space-y-2">
                  {parking.image_url || parking.image ? (
                    <img
                      src={parking.image_url || parking.image}
                      alt={parking.name}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                  ) : null}

                  <div>
                    {isNearest && (
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                        📍 Nearest Parking Spot
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {parking.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {parking.address || parking.location || "City Location"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-extrabold text-emerald-600">
                      {parking.available_slots ?? 12} Spots Free
                    </span>
                    <span className="font-black text-slate-800">
                      {(parking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${parking.hourly_rate ?? 50}/hr`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBookParking && onBookParking(parking)}
                    className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold text-center transition shadow-sm"
                  >
                    Reserve Spot Now &rarr;
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* SELECTED PARKING BOTTOM PREVIEW CARD ON MAP */}
      {selectedParking && (
        <div className="absolute bottom-4 left-4 right-4 z-30 max-w-lg mx-auto animate-slide-up">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-2xl shrink-0">
                {selectedParking.has_ev ? "⚡" : "🚗"}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {selectedParking.available_slots ?? 12} spots free
                  </span>
                </div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                  {selectedParking.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 font-medium">
                  {selectedParking.address || selectedParking.location || "City Location"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedParking.latitude || 19.0760},${selectedParking.longitude || 72.8777}`,
                    "_blank"
                  )
                }
                className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition"
                title="Google Maps Navigation"
              >
                <FiNavigation className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onBookParking && onBookParking(selectedParking)}
                className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Reserve {(selectedParking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${selectedParking.hourly_rate ?? 50}/hr`}</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
