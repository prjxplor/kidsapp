import { NextRequest, NextResponse } from "next/server";
import { Activity, ActivityCategory } from "@kids-app/shared";
import { fetchFromOSM } from "@/lib/osm";
import { fetchFromFoursquare } from "@/lib/foursquare";
import { getCached, setCached } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 5000);
  const category = searchParams.get("category") as ActivityCategory | null ?? undefined;
  const openNow = searchParams.get("openNow") === "true";
  const query = searchParams.get("q") ?? undefined;

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // When a text query is provided, skip cache and search Foursquare directly
  let osmResults: Activity[] = [];
  let fsqResults: Activity[] = [];

  if (query) {
    console.log("[search] query:", query, "lat:", lat, "lng:", lng);
    fsqResults = await fetchFromFoursquare(lat, lng, radius, category, query);
    console.log("[search] fsqResults count:", fsqResults.length);
  } else {
    // --- OSM: parks, playgrounds ---
    const osmCached = await getCached(lat, lng, category, "osm");
    if (osmCached) {
      osmResults = osmCached;
    } else {
      osmResults = await fetchFromOSM(lat, lng, radius, category);
      setCached(lat, lng, category, "osm", osmResults).catch(console.error);
    }

    // --- Foursquare: studios, classes, gyms ---
    const fsqCached = await getCached(lat, lng, category, "foursquare");
    if (fsqCached) {
      fsqResults = fsqCached;
    } else {
      fsqResults = await fetchFromFoursquare(lat, lng, radius, category);
      setCached(lat, lng, category, "foursquare", fsqResults).catch(console.error);
    }
  }

  // --- Merge, deduplicate by name proximity, filter, sort ---
  const seen = new Set<string>();
  const activities: Activity[] = [];

  for (const activity of [...fsqResults, ...osmResults]) {
    const key = activity.name.toLowerCase().replace(/\s+/g, "");
    if (!seen.has(key)) {
      seen.add(key);
      activities.push(activity);
    }
  }

  const filtered = activities.filter((a) => {
    if (openNow && a.openNow === false) return false;
    return true;
  });

  // Sort: rated items first, then alphabetical
  filtered.sort((a, b) => {
    if (b.rating && a.rating) return b.rating - a.rating;
    if (b.rating) return 1;
    if (a.rating) return -1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ activities: filtered.slice(0, 30) });
}
