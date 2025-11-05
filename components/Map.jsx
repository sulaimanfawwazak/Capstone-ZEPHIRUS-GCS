// components/Map.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";

function BingHybridLayer() {
  const map = useMap();

  useEffect(() => {
    const BingTileLayer = L.TileLayer.extend({
      getTileUrl: function (coords) {
        const quadKey = this._coordsToQuadKey(coords);
        return L.Util.template(this._url, {
          q: quadKey,
          s: this._getSubdomain(coords),
        });
      },
      _coordsToQuadKey: ({ x, y, z }) => {
        let quadKey = "";
        for (let i = z; i > 0; i--) {
          let digit = 0;
          const mask = 1 << (i - 1);
          if ((x & mask) !== 0) digit++;
          if ((y & mask) !== 0) digit += 2;
          quadKey += digit.toString();
        }
        return quadKey;
      },
    });

    const bingTileLayer = new BingTileLayer(
      "https://ecn.{s}.tiles.virtualearth.net/tiles/h{q}.jpeg?g=12825",
      {
        attribution: "&copy; Microsoft",
        subdomains: ["t0", "t1", "t2", "t3", "t5", "t6"],
        minZoom: 2,
        maxZoom: 19,
      }
    );

    bingTileLayer.addTo(map);
    return () => map.removeLayer(bingTileLayer);
  }, [map]);

  return null;
}

// Create a custom icon that supports rotation
function createRotatedPlaneIcon(iconUrl, heading) {
  return L.divIcon({
    html: `
      <div style="
        transform: rotate(${heading}deg);
        transition: transform 0.5s ease;
        width: 40px;
        height: 40px;
      ">
        <img 
          src="${iconUrl}" 
          style="width: 100%; height: 100%;" 
          alt="UAV"
        />
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20], // Center of the icon
    className: 'rotated-plane-icon'
  });
}

// Component to update plane position and rotation
function PlaneMarker({ planeLocation, planeIcon, heading, followUAV, onFollowToggle }) {
  const map = useMap();
  const markerRef = useRef();

  // Update plane position and rotation when data changes
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      
      // Update position
      marker.setLatLng([planeLocation.lat, planeLocation.lng]);
      
      // Update icon with new rotation
      const newIcon = createRotatedPlaneIcon(planeIcon.iconUrl, heading);
      marker.setIcon(newIcon);
      
      // Pan map to follow plane if toggle was on
      if (followUAV)  {
        map.panTo([planeLocation.lat, planeLocation.lng]);
      }
    }
  }, [planeLocation, heading, planeIcon, map, followUAV]);

  return (
    <Marker
      ref={markerRef}
      position={[planeLocation.lat, planeLocation.lng]}
      icon={createRotatedPlaneIcon(planeIcon.iconUrl, heading)}
    >
      <Popup>
        <div className="text-center">
          <strong>UAV Position</strong><br />
          Heading: {heading}°<br />
          Lat: {planeLocation.lat}<br />
          Lon: {planeLocation.lon || planeLocation.lng}<br />
          <br />
          <button 
            onClick={onFollowToggle}
            className={`px-3 py-1 rounded text-white text-sm ${
              followUAV 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {followUAV ? 'Following UAV' : 'Follow UAV'}
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

// Component to draw flight trail
function FlightTrail({ positions }) {
  return (
    <Polyline
      positions={positions}
      color="yellow"
      weight={5}
      opacity={1}
      // dashArray="10, 10"
    />
  );
}

// Map Controls Component
function MapControls({ followUAV, onFollowToggle, onClearTrail }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 space-y-2">
      <div className="flex items-center space-x-2">
        <button
          onClick={onFollowToggle}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            followUAV 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {followUAV ? '📍 Following' : '📍 Follow UAV'}
        </button>
        <button
          onClick={onClearTrail}
          className="px-3 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded hover:bg-red-700"
        >
          🗑️ Clear Trail
        </button>
      </div>
      <div className="text-xs text-center text-gray-600">
        {followUAV ? 'Map is following UAV' : 'Map is stationary'}
      </div>
    </div>
  );
}

export default function Map({ 
  homeLocation, 
  planeLocation, 
  homeIcon, 
  planeIcon,
  heading = 0,
  flightTrail = [],
  onClearTrail
}) {
  const homeIconObject = L.icon(homeIcon);
  // const planeIconObject = L.icon(planeIcon);
  const [followUAV, setFollowUAV] = useState(false); // Default to not following

  const handleFollowToggle = () => {
    setFollowUAV(!followUAV);
  };

  return (
    <MapContainer
      center={[homeLocation.lat, homeLocation.lng]}
      zoom={18}
      className="w-full h-full"
    >
      <BingHybridLayer />

      {/* Map Controls */}
      <MapControls 
        followUAV={followUAV}
        onFollowToggle={handleFollowToggle}
        onClearTrail={onClearTrail}
      />

      {/* Home Marker */}
      <Marker position={[homeLocation.lat, homeLocation.lng]} icon={homeIconObject}>
        <Popup>
          <div className="text-center">
            <strong>Home Location</strong><br />
            Lat: {homeLocation.lat}<br />
            Lon: {homeLocation.lon || homeLocation.lng}<br />
          </div>
        </Popup>
      </Marker>

      {/* Flight Trail */}
      {flightTrail.length > 1 && (
        <FlightTrail positions={flightTrail} />
      )}

      {/* Plane Marker with rotation */}
      <PlaneMarker 
        planeLocation={planeLocation}
        planeIcon={planeIcon}
        heading={heading}
        followUAV={followUAV}
        onFollowToggle={handleFollowToggle}
      />
    </MapContainer>
  );
}
