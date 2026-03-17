"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Activity, UserLocation } from "@kids-app/shared";

const CATEGORY_COLORS: Record<string, string> = {
  outdoor: "#16a34a",
  sport: "#2563eb",
  creative: "#9333ea",
  education: "#d97706",
  playspace: "#ea580c",
};

interface Props {
  location: UserLocation;
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

export default function MapView({ location, activities, onSelectActivity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lng, location.lat],
      zoom: 13,
    });

    // User location dot
    new mapboxgl.Marker({ color: "#ef4444" })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setText("You are here"))
      .addTo(map);

    mapRef.current = map;

    return () => map.remove();
  }, [location]);

  // Update markers when activities change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    activities.forEach((activity) => {
      const color = CATEGORY_COLORS[activity.category] ?? "#6b7280";

      const el = document.createElement("div");
      el.style.cssText = `
        width: 28px; height: 28px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px;
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([activity.lng, activity.lat])
        .addTo(map);

      el.addEventListener("click", () => onSelectActivity(activity));
      markersRef.current.push(marker);
    });
  }, [activities, onSelectActivity]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />
  );
}
