import { useEffect, useMemo, useRef, useState } from "react";
import { appEnv } from "../env";

const MAP_SCRIPT_ID = "google-maps-sdk";

const normalizeLocation = (location) => {
  if (!location) return null;

  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return { lat: location.lat, lng: location.lng };
  }

  if (typeof location.latitude === "number" && typeof location.longitude === "number") {
    return { lat: location.latitude, lng: location.longitude };
  }

  return null;
};

export default function Map({ location }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(Boolean(window.google?.maps));
  const [mapError, setMapError] = useState("");
  const point = useMemo(() => normalizeLocation(location), [location]);

  useEffect(() => {
    const mapsKey = appEnv.googleMapsApiKey;

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    if (!mapsKey || mapsKey.includes("YOUR_")) {
      setMapError("Map key missing");
      return;
    }

    const existingScript = document.getElementById(MAP_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true), { once: true });
      existingScript.addEventListener("error", () => setMapError("Map unavailable"), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setMapError("Map unavailable");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !point || !containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: point,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1f2320" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#f3f4ea" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1f2320" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#394138" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#233947" }] }
        ]
      });

      markerRef.current = new window.google.maps.Marker({
        position: point,
        map: mapRef.current,
        title: "Minnex Go partner"
      });
      return;
    }

    markerRef.current.setPosition(point);
    mapRef.current.panTo(point);
  }, [isLoaded, point]);

  if (!point) {
    return (
      <div className="map-fallback">
        <span className="pulse-pin" />
        <p>Locating partner</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="map-fallback map-fallback-grid">
        <span className="route-line" />
        <span className="pulse-pin" />
        <p>{mapError}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="map-canvas" aria-label="Delivery map" />;
}
