import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Orange pin for merchants
const merchantIcon = L.icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#F97316"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>`
    ),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

// Blue dot for user
const userIcon = L.icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9" fill="#3B82F6" stroke="white" stroke-width="3"/>
      </svg>`
    ),
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

function getDirectionsUrl(lat, lng, label) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
}

export default function MapView({ merchants, userLocation }) {
  const withCoords = merchants.filter((m) => m.latitude && m.longitude);
  const center = userLocation || (withCoords.length > 0
    ? [withCoords[0].latitude, withCoords[0].longitude]
    : [25.2854, 51.531]);

  return (
    <div className="relative h-[calc(100vh-280px)] w-full rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={userLocation ? 13 : 12} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* User location */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <p className="font-semibold text-sm text-center">You are here</p>
            </Popup>
          </Marker>
        )}

        {/* Merchant markers */}
        {withCoords.map((merchant) => (
          <Marker key={merchant.id} position={[merchant.latitude, merchant.longitude]} icon={merchantIcon}>
            <Popup minWidth={180}>
              <div className="space-y-2 py-1">
                {/* Logo + name */}
                <div className="flex items-center gap-2">
                  {merchant.logo_url ? (
                    <img src={merchant.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-sm">
                      🏪
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm leading-tight">{merchant.name}</p>
                    {merchant.category && (
                      <p className="text-xs text-gray-400 capitalize">{merchant.category}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                {merchant.address && (
                  <p className="text-xs text-gray-500 leading-snug">{merchant.address}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-1.5 pt-1">
                  <Link
                    to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}
                    className="flex-1 text-center text-xs bg-[#0A1931] text-white px-2 py-1.5 rounded-lg font-medium"
                  >
                    View Details
                  </Link>
                  <a
                    href={getDirectionsUrl(merchant.latitude, merchant.longitude, merchant.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs bg-orange-500 text-white px-2 py-1.5 rounded-lg font-medium"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Empty state overlay when no merchants have coords */}
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl pointer-events-none">
          <div className="text-center px-6">
            <p className="text-2xl mb-2">📍</p>
            <p className="text-sm font-semibold text-gray-700">No locations on map yet</p>
            <p className="text-xs text-gray-400 mt-1">Merchants haven't added their coordinates yet</p>
          </div>
        </div>
      )}
    </div>
  );
}