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
        ${
          isNearest
            ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-md animate-bounce">
                📍 Nearest Spot
               </div>`
            : ""
        }
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl shadow-xl border-2 backdrop-blur-md transition-all ${
          isSelected
            ? "bg-slate-900 text-white border-indigo-400 ring-4 ring-indigo-500/30"
            : isFree
            ? "bg-emerald-600 text-white border-white shadow-emerald-600/30"
            : isNearest
            ? "bg-indigo-600 text-white border-white shadow-indigo-600/40 ring-2 ring-indigo-400"
            : "bg-white text-slate-900 border-slate-200 shadow-slate-900/15"
        }">
          <span class="text-[11px] font-black leading-none">${rateLabel}</span>
          <span class="w-1.5 h-1.5 rounded-full ${
            isFree ? "bg-white" : isNearest ? "bg-amber-300" : "bg-emerald-500"
          }"></span>
        </div>
        <div class="w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 border-r-2 border-b-2 ${
          isSelected
            ? "bg-slate-900 border-indigo-400"
            : isFree
            ? "bg-emerald-600 border-white"
            : isNearest
            ? "bg-indigo-600 border-white"
            : "bg-white border-slate-200"
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

  // User location marker icon (glowing blue radar pulse)
  const userIcon = useMemo(() => {
    const userHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute"></div>
        <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
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
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
      {/* FLOATING MAP CONTROLS */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onLocateUser}
            disabled={isLocating}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-md border text-xs font-extrabold shadow-lg transition active:scale-95 disabled:opacity-50 ${
              userCoords
                ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30"
                : "bg-white/95 text-slate-800 border-slate-200 hover:text-indigo-600"
            }`}
          >
            <FiCompass className={`w-4 h-4 ${isLocating ? "animate-spin" : userCoords ? "text-amber-300" : "text-indigo-600"}`} />
            <span>{isLocating ? "Detecting GPS..." : userCoords ? "🎯 My Current Location (Active)" : "🎯 Use My Current Location"}</span>
          </button>

          <span className="hidden sm:inline-flex px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/10 shadow-lg">
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-indigo-700 text-xs font-bold border border-slate-200 shadow-lg hover:bg-slate-50 transition"
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-extrabold shadow-xl hover:shadow-indigo-500/25 transition active:scale-95"
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
        <div className="absolute bottom-4 left-4 right-4 z-[400] max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {selectedParking.image_url || selectedParking.image ? (
                <img
                  src={selectedParking.image_url || selectedParking.image}
                  alt={selectedParking.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xl shrink-0">
                  <FiMapPin />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  {selectedParking.id === nearestParkingId && (
                    <Badge variant="primary" size="sm">
                      📍 Nearest to You
                    </Badge>
                  )}
                  <span className="text-xs font-black text-emerald-600">
                    {selectedParking.available_slots ?? 12} spots free
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                  {selectedParking.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">
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
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Google Maps Navigation"
              >
                <FiNavigation className="w-4 h-4" />
              </button>

              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-initial"
                iconRight={FiArrowRight}
                onClick={() => onBookParking && onBookParking(selectedParking)}
              >
                Book Spot {(selectedParking.hourly_rate ?? -1) === 0 ? "FREE" : `₹${selectedParking.hourly_rate ?? 50}/hr`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
