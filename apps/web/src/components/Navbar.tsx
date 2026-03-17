"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Props {
  locationLabel?: string;
  largeLogo?: boolean;
  onLocationChange?: (loc: { lat: number; lng: number }, label: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
}

export default function Navbar({ locationLabel, largeLogo, onLocationChange, searchQuery, onSearchChange, onSearchSubmit }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setInput(locationLabel ?? "");
    setError("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const useGPS = () => {
    if (!onLocationChange) return;
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const label = data.address?.city || data.address?.town || data.address?.village || "Your location";
          localStorage.setItem("kidsapp_location", JSON.stringify({ lat, lng }));
          localStorage.setItem("kidsapp_location_label", label);
          onLocationChange({ lat, lng }, label);
          setEditing(false);
        } catch {
          onLocationChange({ lat, lng }, "Your location");
          setEditing(false);
        }
        setBusy(false);
      },
      () => { setError("Could not get location."); setBusy(false); }
    );
  };

  const geocode = async () => {
    const q = input.trim();
    if (!q || !onLocationChange) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);
      const data = await res.json();
      if (!data.length) { setError("Location not found."); setBusy(false); return; }
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      const label = data[0].display_name.split(",").slice(0, 2).join(",").trim();
      localStorage.setItem("kidsapp_location", JSON.stringify(loc));
      localStorage.setItem("kidsapp_location_label", label);
      onLocationChange(loc, label);
      setEditing(false);
    } catch {
      setError("Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <nav className="bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#0077B6]/15 h-16 flex items-center px-6 sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-base font-black shadow-sm group-hover:shadow-md transition" style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}>
            K
          </div>
          <span className={`font-extrabold tracking-tight text-gray-900 transition group-hover:text-[#0077B6] ${largeLogo ? "text-xl" : "text-base"}`}>
            KidsActivities
          </span>
        </Link>

        {/* Search */}
        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-md flex items-center bg-white border border-[#B8DDF0]/60 rounded-xl overflow-hidden focus-within:border-[#0077B6] focus-within:ring-2 focus-within:ring-[#0077B6]/10 transition shadow-sm">
            <div className="flex-1 flex items-center px-3 gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.(searchQuery ?? "")}
                placeholder="Search activities..."
                className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => { onSearchChange(""); onSearchSubmit?.(""); }} className="text-gray-300 hover:text-gray-500 transition">×</button>
              )}
            </div>
            <button
              onClick={() => onSearchSubmit?.(searchQuery ?? "")}
              className="text-white text-xs font-bold px-4 py-3 transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}
            >
              Search
            </button>
          </div>
        )}

        {/* Location — editable */}
        {onLocationChange && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <div className="flex items-center bg-white border border-[#0077B6]/40 ring-2 ring-[#0077B6]/10 rounded-xl px-3 gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0077B6" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") geocode(); if (e.key === "Escape") setEditing(false); }}
                    placeholder="City or postcode..."
                    className="text-sm py-2 bg-transparent focus:outline-none w-40 text-gray-900 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={geocode}
                  disabled={busy || !input.trim()}
                  className="text-sm font-bold px-3 py-2 text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition"
                  style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}
                >
                  {busy ? "..." : "Go"}
                </button>
                <button onClick={useGPS} disabled={busy} title="Use GPS" className="p-2 disabled:opacity-40 transition" style={{ color: "#0077B6" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
                  </svg>
                </button>
                <button onClick={() => setEditing(false)} className="text-gray-300 hover:text-gray-500 text-xl leading-none transition">×</button>
                {error && <span className="text-xs text-red-500">{error}</span>}
              </>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition group bg-white border border-[#B8DDF0]/60 rounded-xl px-3 py-2 shadow-sm hover:border-[#0077B6]/40"
              >
                <svg className="w-3.5 h-3.5" style={{ color: "#0077B6" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="font-medium">{locationLabel || "Set location"}</span>
                <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Location — read-only */}
        {!onLocationChange && locationLabel && (
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" style={{ color: "#0077B6" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {locationLabel}
          </span>
        )}
      </div>
    </nav>
  );
}
