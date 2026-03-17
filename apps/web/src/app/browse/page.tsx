"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ActivityCategory, SearchFilters } from "@kids-app/shared";
import { ACTIVITY_CATEGORIES, DEFAULT_RADIUS_METERS } from "@kids-app/shared";
import Navbar from "@/components/Navbar";
import ActivityCard from "@/components/ActivityCard";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const RADIUS_OPTIONS = [
  { label: "1 mile",   value: 1609  },
  { label: "5 miles",  value: 8047  },
  { label: "10 miles", value: 16093 },
  { label: "20 miles", value: 32187 },
];

const CATEGORY_DOT: Record<string, string> = {
  music:    "#f43f5e",
  sport:    "#f97316",
  arts:     "#8b5cf6",
  stem:     "#14b8a6",
  dance:    "#d946ef",
  language: "#3b82f6",
  outdoor:  "#22c55e",
};

type ViewMode = "list" | "map";

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<SearchFilters>({
    radiusMeters: DEFAULT_RADIUS_METERS,
    category: (searchParams.get("category") as ActivityCategory) ?? undefined,
    openNow: undefined,
    venueType: undefined,
    price: undefined,
  });

  useEffect(() => {
    const saved = localStorage.getItem("kidsapp_location");
    const savedLabel = localStorage.getItem("kidsapp_location_label");
    if (saved) {
      try {
        setLocation(JSON.parse(saved));
        if (savedLabel) setLocationLabel(savedLabel);
        return;
      } catch {}
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        localStorage.setItem("kidsapp_location", JSON.stringify(loc));
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category") as ActivityCategory | null;
    setFilters((f) => ({ ...f, category: cat ?? undefined }));
  }, [searchParams]);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(filters.radiusMeters),
      ...(filters.category && { category: filters.category }),
      ...(filters.openNow && { openNow: "true" }),
      ...(submittedQuery && { q: submittedQuery }),
    });
    fetch(`/api/activities?${params}`)
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [location, filters.radiusMeters, filters.category, filters.openNow, submittedQuery]);

  const setCategory = useCallback((cat: ActivityCategory | undefined) => {
    setFilters((f) => ({ ...f, category: cat }));
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("category", cat); else params.delete("category");
    router.replace(`/browse?${params.toString()}`);
  }, [searchParams, router]);

  const activeLabel = filters.category
    ? ACTIVITY_CATEGORIES.find((c) => c.value === filters.category)?.label
    : "All Activities";

  const displayedActivities = activities.filter((a) => {
    if (filters.venueType === "outdoor" && a.category !== "outdoor" && !a.id.startsWith("osm-")) return false;
    if (filters.venueType === "indoor" && (a.category === "outdoor" || a.id.startsWith("osm-"))) return false;
    if (filters.price === "free" && !a.id.startsWith("osm-")) return false;
    if (filters.price === "paid" && a.id.startsWith("osm-")) return false;
    return true;
  });

  const activeFilterCount = [filters.category, filters.openNow, filters.venueType, filters.price].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar
        locationLabel={locationLabel || (location ? "Nearby" : undefined)}
        onLocationChange={(loc, label) => { setLocation(loc); setLocationLabel(label); }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(q) => setSubmittedQuery(q)}
      />

      {/* Page header */}
      <div className="bg-white/80 backdrop-blur-sm" style={{ borderBottom: "1px solid rgba(0,119,182,0.12)" }}>
        <div className="px-6 py-4 max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-gray-700 transition font-medium">Home</Link>
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-gray-900">{activeLabel}</span>
          </div>

          {/* List / Map toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 text-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold transition ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold transition ${
                viewMode === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex-1 flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-60 flex-shrink-0 sticky top-20 space-y-2">

          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-1" style={{ background: "#EBF5FC", border: "1.5px solid #CAF0F8" }}>
              <span className="text-xs font-semibold" style={{ color: "#0077B6" }}>{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</span>
              <button
                onClick={() => setFilters((f) => ({ ...f, category: undefined, openNow: undefined, venueType: undefined, price: undefined }))}
                className="text-xs font-semibold transition hover:opacity-70"
                style={{ color: "#0077B6" }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Category */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #CAF0F8" }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</p>
            <div className="space-y-0.5">
              <button
                onClick={() => setCategory(undefined)}
                className="w-full text-left text-sm px-3 py-2 rounded-xl transition font-medium"
                style={!filters.category ? { background: "#0077B6", color: "white" } : { color: "#374151" }}
                onMouseEnter={e => { if (filters.category) (e.target as HTMLElement).style.background = "#F3F4F6"; }}
                onMouseLeave={e => { if (filters.category) (e.target as HTMLElement).style.background = ""; }}
              >
                All Categories
              </button>
              {ACTIVITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value as ActivityCategory)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition flex items-center gap-2.5"
                  style={filters.category === cat.value ? { background: "#0077B6", color: "white", fontWeight: 600 } : { color: "#374151" }}
                  onMouseEnter={e => { if (filters.category !== cat.value) (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}
                  onMouseLeave={e => { if (filters.category !== cat.value) (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: filters.category === cat.value ? "white" : (CATEGORY_DOT[cat.value] ?? "#9ca3af") }} />
                  <span>{cat.emoji} {cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #CAF0F8" }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Distance</p>
            <div className="space-y-0.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setFilters((f) => ({ ...f, radiusMeters: r.value }))}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition font-medium"
                  style={filters.radiusMeters === r.value ? { background: "#0077B6", color: "white" } : { color: "#374151" }}
                  onMouseEnter={e => { if (filters.radiusMeters !== r.value) (e.target as HTMLElement).style.background = "#F3F4F6"; }}
                  onMouseLeave={e => { if (filters.radiusMeters !== r.value) (e.target as HTMLElement).style.background = ""; }}
                >
                  Within {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Venue type */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #CAF0F8" }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Venue Type</p>
            <div className="space-y-0.5">
              {(["indoor", "outdoor"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilters((f) => ({ ...f, venueType: f.venueType === v ? undefined : v }))}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition font-medium"
                  style={filters.venueType === v ? { background: "#0077B6", color: "white" } : { color: "#374151" }}
                  onMouseEnter={e => { if (filters.venueType !== v) (e.target as HTMLElement).style.background = "#F3F4F6"; }}
                  onMouseLeave={e => { if (filters.venueType !== v) (e.target as HTMLElement).style.background = ""; }}
                >
                  {v === "indoor" ? "🏠 Indoor" : "🌳 Outdoor"}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #CAF0F8" }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price</p>
            <div className="space-y-0.5">
              {(["free", "paid"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters((f) => ({ ...f, price: f.price === p ? undefined : p }))}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition font-medium"
                  style={filters.price === p ? { background: "#0077B6", color: "white" } : { color: "#374151" }}
                  onMouseEnter={e => { if (filters.price !== p) (e.target as HTMLElement).style.background = "#F3F4F6"; }}
                  onMouseLeave={e => { if (filters.price !== p) (e.target as HTMLElement).style.background = ""; }}
                >
                  {p === "free" ? "🆓 Free" : "💳 Paid"}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid #CAF0F8" }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Availability</p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span
                onClick={() => setFilters((f) => ({ ...f, openNow: f.openNow ? undefined : true }))}
                className="w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
                style={{ background: filters.openNow ? "#0077B6" : "#E5E7EB" }}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${filters.openNow ? "translate-x-4" : "translate-x-0"}`} />
              </span>
              <span className="text-sm font-medium text-gray-600">Open now</span>
            </label>
          </div>
        </aside>

        {/* ── Results ── */}
        <main className="flex-1 min-w-0">
          {!location ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Enable location access</h3>
              <p className="text-gray-400 text-sm mb-6">Allow location access to see activities near you</p>
              <button
                onClick={() => navigator.geolocation.getCurrentPosition(
                  (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
                  () => {}
                )}
                className="text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-sm"
                style={{ background: "linear-gradient(135deg, #0077B6, #0096C7)" }}
              >
                Share Location
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{activeLabel}</h2>
                  {!loading && (
                    <p className="text-sm text-gray-400 mt-0.5">{displayedActivities.length} results found</p>
                  )}
                </div>

                {(filters.category || filters.openNow || filters.venueType || filters.price) && (
                  <div className="flex flex-wrap gap-2">
                    {filters.category && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ background: "#0077B6" }}>
                        {ACTIVITY_CATEGORIES.find((c) => c.value === filters.category)?.emoji}{" "}
                        {ACTIVITY_CATEGORIES.find((c) => c.value === filters.category)?.label}
                        <button onClick={() => setCategory(undefined)} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                      </span>
                    )}
                    {filters.openNow && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                        Open now
                        <button onClick={() => setFilters((f) => ({ ...f, openNow: undefined }))} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                      </span>
                    )}
                    {filters.venueType && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                        {filters.venueType === "indoor" ? "🏠 Indoor" : "🌳 Outdoor"}
                        <button onClick={() => setFilters((f) => ({ ...f, venueType: undefined }))} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                      </span>
                    )}
                    {filters.price && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                        {filters.price === "free" ? "🆓 Free" : "💳 Paid"}
                        <button onClick={() => setFilters((f) => ({ ...f, price: undefined }))} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {viewMode === "map" ? (
                <div className="h-[580px] rounded-2xl overflow-hidden shadow-sm" style={{ border: "1.5px solid #CAF0F8" }}>
                  <MapView
                    location={location}
                    activities={activities}
                    onSelectActivity={(a) => { setSelectedActivity(a); setViewMode("list"); }}
                  />
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" style={{ border: "1.5px solid #CAF0F8" }} />
                  ))}
                </div>
              ) : displayedActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl" style={{ border: "1.5px solid #CAF0F8" }}>
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {submittedQuery ? `No results for "${submittedQuery}"` : "No activities found"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {submittedQuery ? "Try a different search term" : "Try a wider distance or different category"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedActivities.map((activity, i) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      index={i}
                      highlighted={activity.id === selectedActivity?.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

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

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
