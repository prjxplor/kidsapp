import { NextRequest, NextResponse } from "next/server";
import { ActivityCategory } from "@kids-app/shared";
import { fetchFromOSM } from "@/lib/osm";
import { setCached } from "@/lib/cache";

const CATEGORIES: (ActivityCategory | undefined)[] = [
  undefined, // all
  "outdoor",
  "sport",
  "arts",
  "music",
  "dance",
  "stem",
  "language",
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 10000);
  const secret = searchParams.get("secret");

  // Basic protection so only you can trigger this
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const results: Record<string, number> = {};

  for (const category of CATEGORIES) {
    try {
      console.log(`[seed-osm] fetching category: ${category ?? "all"}`);
      const activities = await fetchFromOSM(lat, lng, radius, category);
      if (activities.length) {
        await setCached(lat, lng, category, "osm", activities);
        results[category ?? "all"] = activities.length;
        console.log(`[seed-osm] cached ${activities.length} results for ${category ?? "all"}`);
      } else {
        results[category ?? "all"] = 0;
      }
      // Small delay between requests to be polite to OSM
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[seed-osm] failed for ${category ?? "all"}:`, err);
      results[category ?? "all"] = -1;
    }
  }

  return NextResponse.json({ ok: true, results });
}
