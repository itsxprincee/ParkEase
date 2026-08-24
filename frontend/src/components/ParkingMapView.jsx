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
  FiMaximize2,
} from "react-icons/fi";
import Badge from "./Badge";
import Button from "./Button";

// Helper component to auto-pan map when coordinates or active selection changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
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

  // Default center: User location -> Nearest parking -> Default city center (19.0760, 72.8777)
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
    return [19.076, 72.8777];
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

  // Create custom modern HTML pin icon for each parking lot
  const createParkingIcon = (parking) => {
    const isNearest = parking.id === nearestParkingId;
    const isFree = (parking.hourly_rate ?? -1) === 0;
    const isSelected = selectedParking?.id === parking.id;
    const rateLabel = isFree ? "FREE" : `₹${parking.hourly_rate ?? 50}`;

    const iconHtml = `
      <div class="relative group cursor-pointer transform transition-transform ${
        isSelected ? "scale-125 z-50" : isNearest ? "scale-110 z-40" : "scale-100 z-10"
      }">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border transition-all ${
          isSelected
            ? "bg-black text-white border-black ring-4 ring-black/20"
            : isFree
            ? "bg-emerald-600 text-white border-emerald-600"
            : isNearest
            ? "bg-black text-white border-black ring-2 ring-emerald-400"
            : "bg-white text-black border-neutral-300 hover:border-black"
        }">
          <span class="text-[11px] font-black leading-none">${rateLabel}</span>
          <span class="w-1.5 h-1.5 rounded-full ${
            isFree ? "bg-white" : isNearest ? "bg-emerald-400" : "bg-black"
          }"></span>
        </div>
        <div class="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b ${
          isSelected || isNearest ? "bg-black border-black" : isFree ? "bg-emerald-600 border-emerald-600" : "bg-white border-neutral-300"
        }"></div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "custom-parking-marker",
      iconSize: [60, 40],
      iconAnchor: [30, 40],
      popupAnchor: [0, -42],
    });
  };

  // User location marker icon
  const userIcon = useMemo(() => {
    const userHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-black/20 animate-ping absolute"></div>
        <div class="w-6 h-6 rounded-full bg-black border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
          🚗
        </div>
      </div>
    `;
    return L.divIcon({
      html: userHtml,
      className: "custom-user-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  return (
    <div className="relative isolate z-0 w-full h-[540px] lg:h-[620px] rounded-3xl overflow-hidden bg-neutral-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      {/* FLOATING MAP CONTROLS */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onLocateUser}
            disabled={isLocating}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 ${
              userCoords
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white"
                : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white"
            }`}
          >
            <FiCompass className={`w-4 h-4 ${isLocating ? "animate-spin text-blue-500" : ""}`} />
            <span>{isLocating ? "Locating..." : userCoords ? "📍 GPS Active" : "📍 Find Nearest"}</span>
          </button>
          <span className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md text-white text-xs font-bold border border-white/10 shadow-md">
            🗺️ {parkingLocations.length} Lots Live
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {userCoords && (
            <button
              type="button"
              onClick={() => {
                if (userCoords) {
                  setSelectedParking(null);
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-white text-xs font-bold border border-zinc-200 dark:border-zinc-700 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              title="Center Map on My Location"
            >
              <span>🚗 Center on Me</span>
            </button>
          )}

          {nearestParkingId && (
            <button
              type="button"
              onClick={() => {
                const nearest = parkingLocations.find((p) => p.id === nearestParkingId);
                if (nearest) setSelectedParking(nearest);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold shadow-md hover:shadow-blue-500/25 transition active:scale-95"
            >
              <span>⚡ Jump to Nearest</span>
              <FiArrowRight />
            </button>
          )}
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <MapContainer
        center={defaultCenter}
        zoom={userCoords ? 14 : 12}
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
                color: "#6366f1",
                fillColor: "#6366f1",
                fillOpacity: 0.08,
                weight: 1,
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
                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">
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
                    className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold text-center transition"
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
