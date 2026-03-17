import { createClient } from "@supabase/supabase-js";
import { Activity, ActivityCategory } from "@kids-app/shared";
import { encodeGeohash } from "./geohash";

const CACHE_TTL_DAYS = 7;

// Use service role key server-side so we can write to cache
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getCached(
  lat: number,
  lng: number,
  category: ActivityCategory | undefined,
  source: string
): Promise<Activity[] | null> {
  const geohash = encodeGeohash(lat, lng, 6);
  const staleAfter = new Date(
    Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("activity_cache")
    .select("activities, fetched_at")
    .eq("geohash", geohash)
    .eq("source", source)
    .eq("category", category ?? "all")
    .gt("fetched_at", staleAfter)
    .maybeSingle();

  if (error || !data) return null;
  return data.activities as Activity[];
}

export async function setCached(
  lat: number,
  lng: number,
  category: ActivityCategory | undefined,
  source: string,
  activities: Activity[]
): Promise<void> {
  const geohash = encodeGeohash(lat, lng, 6);

  await supabase.from("activity_cache").upsert(
    {
      geohash,
      source,
      category: category ?? "all",
      activities,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "geohash,category,source" }
  );
}
