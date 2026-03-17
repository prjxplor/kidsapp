"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, UserLocation } from "@kids-app/shared";
import { ACTIVITY_CATEGORIES } from "@kids-app/shared";
import Navbar from "@/components/Navbar";
import ActivityCard from "@/components/ActivityCard";

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  music:    { bg: "#FFE4EC", text: "#BE185D" },
  sport:    { bg: "#FFEDD5", text: "#C2410C" },
  arts:     { bg: "#EDE9FE", text: "#6D28D9" },
  stem:     { bg: "#CCFBF1", text: "#0F766E" },
  dance:    { bg: "#FAE8FF", text: "#A21CAF" },
  language: { bg: "#DBEAFE", text: "#1D4ED8" },
  outdoor:  { bg: "#DCFCE7", text: "#15803D" },
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  sport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93c2.17 2.17 3.32 5.1 3.07 8.07M19.07 4.93c-2.17 2.17-3.32 5.1-3.07 8.07M4.93 19.07c2.17-2.17 3.32-5.1 3.07-8.07M19.07 19.07c-2.17-2.17-3.32-5.1-3.07-8.07" />
    </svg>
  ),
  arts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 2.24 4 5 4 .55 0 1 .45 1 1v1c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-1c0-.55.45-1 1-1 2.76 0 5-1.24 5-4 0-5.52-4.48-10-10-10z" />
      <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  stem: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  dance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="12" cy="4" r="2" /><path d="M12 6v6l-3 3m3-3l3 3M9 21l3-6 3 6" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M2 5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V5z" />
    </svg>
  ),
  outdoor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M17 22V12L12 2 7 12v10" /><path d="M7 22H2l5-10" /><path d="M17 22h5l-5-10" />
    </svg>
  ),
};

export default function Home() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [locationInput, setLocationInput] = useState("");
  const [popular, setPopular] = useState<Activity[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!location) return;
    localStorage.setItem("kidsapp_location", JSON.stringify(location));
    if (locationLabel) localStorage.setItem("kidsapp_location_label", locationLabel);
  }, [location, locationLabel]);

  useEffect(() => {
    const saved = localStorage.getItem("kidsapp_location");
    const savedLabel = localStorage.getItem("kidsapp_location_label");
    if (saved && !location) {
      try {
        setLocation(JSON.parse(saved));
        if (savedLabel) { setLocationLabel(savedLabel); setLocationInput(savedLabel); }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoadingPopular(true);
    fetch(`/api/activities?lat=${location.lat}&lng=${location.lng}&radius=5000`)
      .then((r) => r.json())
      .then((d) => setPopular((d.activities ?? []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingPopular(false));
  }, [location]);

  const handleBrowseAll = () => {
    const q = search.trim();
    window.location.href = q ? `/browse?q=${encodeURIComponent(q)}` : "/browse";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar
        largeLogo
        locationLabel={locationLabel || undefined}
        onLocationChange={(loc, label) => { setLocation(loc); setLocationLabel(label); setLocationInput(label); }}
      />

      {/* ── Hero ── */}
      <section className="pt-20 pb-16 px-6 bg-[#FAFAFA]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border text-xs font-semibold px-4 py-2 rounded-full mb-6 shadow-sm" style={{ borderColor: "rgba(0,119,182,0.2)", color: "#0077B6" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#0077B6" }} />
            Trusted by thousands of families
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-2 tracking-tight whitespace-nowrap" style={{ color: "#0077B6" }}>
            Discover What Lights Your Kid Up
          </h1>

          <p className="text-gray-500 text-base mb-8 whitespace-nowrap">
            Because the next great thing your kid loves might be just down the street.
          </p>

          <div className="max-w-lg mx-auto">
            <div className="flex gap-2 bg-white rounded-2xl shadow-md p-2" style={{ border: "1px solid rgba(0,119,182,0.15)" }}>
              <div className="flex-1 flex items-center px-3 gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBrowseAll()}
                  placeholder="Try 'swimming', 'piano', 'coding'..."
                  className="flex-1 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
              <button
                onClick={handleBrowseAll}
                className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90 shadow-sm"
                style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}
              >
                Browse All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by Category ── */}
      <section className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900">Browse by Category</h2>
          <p className="text-gray-400 text-sm mt-1">Find activities that match your child's interests</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {/* All */}
          <Link
            href="/browse"
            className="group flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-2xl hover:shadow-md hover:scale-105 transition-all duration-150"
            style={{ background: "#EBF5FC", color: "#0077B6", border: "1.5px solid #CAF0F8" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 group-hover:scale-110 transition-transform">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-xs font-bold">All</span>
          </Link>

          {ACTIVITY_CATEGORIES.map((cat) => {
            const s = CATEGORY_STYLE[cat.value] ?? { bg: "#F3F4F6", text: "#374151" };
            return (
              <Link
                key={cat.value}
                href={`/browse?category=${cat.value}`}
                className="group flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-2xl hover:shadow-md hover:scale-105 transition-all duration-150"
                style={{ background: s.bg, color: s.text, border: "1.5px solid #CAF0F8" }}
              >
                <span className="group-hover:scale-110 transition-transform">
                  {CATEGORY_ICON[cat.value] ?? <span className="text-2xl">{cat.emoji}</span>}
                </span>
                <span className="text-xs font-bold">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Popular Activities ── */}
      <section className="px-6 pb-16 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Popular Near You</h2>
            <p className="text-gray-400 text-sm mt-1">
              {location ? `Top-rated activities around ${locationLabel || "your area"}` : "Set your location to see nearby activities"}
            </p>
          </div>
          {location && (
            <Link
              href="/browse"
              className="flex items-center gap-1.5 text-sm font-semibold border rounded-xl px-4 py-2 transition hover:opacity-80"
              style={{ color: "#0077B6", background: "#EBF5FC", borderColor: "rgba(0,119,182,0.2)" }}
            >
              View all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {!location ? (
          <div className="rounded-3xl p-12 text-center border" style={{ background: "linear-gradient(135deg, #EBF5FC, #F4F9FD)", borderColor: "rgba(0,119,182,0.15)" }}>
            <div className="text-5xl mb-4">📍</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Share your location</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Allow location access or set your city to discover activities nearby
            </p>
            <button
              onClick={() => navigator.geolocation.getCurrentPosition(
                async (p) => {
                  const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
                  setLocation(loc);
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`);
                    const data = await res.json();
                    const label = data.address?.city || data.address?.town || "Your location";
                    setLocationLabel(label);
                  } catch {}
                },
                () => {}
              )}
              className="text-white text-sm font-bold px-8 py-3 rounded-xl hover:opacity-90 transition shadow-sm"
              style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}
            >
              Use My Location
            </button>
          </div>
        ) : loadingPopular ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white/70 rounded-2xl h-72 animate-pulse" style={{ border: "1px solid rgba(0,119,182,0.08)" }} />
            ))}
          </div>
        ) : popular.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">No activities found near {locationLabel}. Try a different location.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popular.map((activity, i) => (
              <ActivityCard key={activity.id} activity={activity} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 mt-auto bg-white/60" style={{ borderTop: "1px solid rgba(0,119,182,0.12)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}>K</div>
            <span className="font-bold text-gray-900 text-sm">KidsActivities</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 KidsActivities. Helping families find the perfect activities.</p>
        </div>
      </footer>
    </div>
  );
}
