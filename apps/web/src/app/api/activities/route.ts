import { NextRequest, NextResponse } from "next/server";
import { Activity, ActivityCategory } from "@kids-app/shared";
import { fetchFromOSM } from "@/lib/osm";
import { fetchFromFoursquare } from "@/lib/foursquare";
import { fetchFromTicketmaster } from "@/lib/ticketmaster";
import { getCached, setCached } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 5000);
  const category = searchParams.get("category") as ActivityCategory | null ?? undefined;
  const openNow = searchParams.get("openNow") === "true";
  const query = searchParams.get("q") ?? undefined;
  const contentType = searchParams.get("contentType") ?? "all"; // "places" | "events" | "all"
  const familyOnly = searchParams.get("familyOnly") === "true";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  let osmResults: Activity[] = [];
  let fsqResults: Activity[] = [];
  let ebResults: Activity[] = [];

  const wantPlaces = contentType === "all" || contentType === "places";
  const wantEvents = contentType === "all" || contentType === "events";

  if (query) {
    if (wantPlaces) fsqResults = await fetchFromFoursquare(lat, lng, radius, category, query).catch(() => []);
    if (wantEvents) ebResults = await fetchFromTicketmaster(lat, lng, radius, category, query, familyOnly).catch(() => []);
  } else {
    if (wantPlaces) {
      // OSM: read from cache only — never call live (populated by /api/seed-osm)
      const osmCached = await getCached(lat, lng, category, "osm").catch(() => null);
      if (osmCached) osmResults = osmCached;

      const fsqCached = await getCached(lat, lng, category, "foursquare").catch(() => null);
      if (fsqCached) {
        fsqResults = fsqCached;
      } else {
        fsqResults = await fetchFromFoursquare(lat, lng, radius, category).catch(() => []);
        if (fsqResults.length) setCached(lat, lng, category, "foursquare", fsqResults).catch(console.error);
      }
    }

    if (wantEvents) {
      ebResults = await fetchFromTicketmaster(lat, lng, radius, category, undefined, familyOnly).catch(() => []);
    }
  }

  // Merge & deduplicate places (not events — events can share venue names)
  const seen = new Set<string>();
  const activities: Activity[] = [];

  for (const activity of [...fsqResults, ...osmResults]) {
    const key = activity.name.toLowerCase().replace(/\s+/g, "");
    if (!seen.has(key)) {
      seen.add(key);
      activities.push(activity);
    }
  }

  // Add events without deduplication
  for (const event of ebResults) {
    activities.push(event);
  }

  const filtered = activities.filter((a) => {
    if (openNow && !a.isEvent && a.openNow === false) return false;
    return true;
  });

  // Sort: events by date first, then rated places, then alphabetical
  filtered.sort((a, b) => {
    if (a.isEvent && b.isEvent) {
      return (a.eventDate ?? "") < (b.eventDate ?? "") ? -1 : 1;
    }
    if (a.isEvent) return -1;
    if (b.isEvent) return 1;
    if (b.rating && a.rating) return b.rating - a.rating;
    if (b.rating) return 1;
    if (a.rating) return -1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ activities: filtered.slice(0, 40) });
}
