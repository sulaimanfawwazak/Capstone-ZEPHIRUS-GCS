// components/Map.jsx
"use client";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
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

export default function Map({ homeLocation, planeLocation, homeIcon, planeIcon }) {
  const homeIconObject = L.icon(homeIcon);
  const planeIconObject = L.icon(planeIcon);

  return (
    <MapContainer
      center={[homeLocation.lat, homeLocation.lng]}
      zoom={18}
      className="w-full h-full"
    >
      <BingHybridLayer />

      {/* Home Marker */}
      <Marker position={[homeLocation.lat, homeLocation.lng]} icon={homeIconObject}>
        <Popup>Home Location</Popup>
      </Marker>

      {/* Plane Marker */}
      <Marker position={[planeLocation.lat, planeLocation.lng]} icon={planeIconObject}>
        <Popup>UAV Start Location</Popup>
      </Marker>
    </MapContainer>
  );
}
