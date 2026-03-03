import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Navigation, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapView({ merchants, userLocation }) {
  const center = userLocation || [25.2854, 51.5310]; // Default: Doha, Qatar

  return (
    <div className="h-[calc(100vh-280px)] w-full rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={userLocation ? 13 : 11}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={L.icon({
            iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23F97316'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3C/svg%3E",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}>
            <Popup>
              <div className="text-center font-semibold">
                <Navigation className="w-4 h-4 inline mr-1" />
                You are here
              </div>
            </Popup>
          </Marker>
        )}

        {/* Merchant markers */}
        {merchants.filter(m => m.latitude && m.longitude).map(merchant => (
          <Marker
            key={merchant.id}
            position={[merchant.latitude, merchant.longitude]}
          >
            <Popup>
              <Link to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}>
                <div className="min-w-[160px]">
                  <h3 className="font-semibold text-sm mb-1">{merchant.name}</h3>
                  {merchant.address && (
                    <p className="text-xs text-gray-500 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{merchant.address}</span>
                    </p>
                  )}
                  <button className="mt-2 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg w-full hover:bg-orange-600">
                    View Details
                  </button>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}