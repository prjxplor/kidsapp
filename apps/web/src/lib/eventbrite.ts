import { Activity, ActivityCategory } from "@kids-app/shared";

const EB_API_KEY = process.env.EVENTBRITE_API_KEY;

// Eventbrite category IDs → our local categories
const EB_CATEGORY_MAP: Record<string, ActivityCategory> = {
  "103": "music",    // Music
  "108": "sport",    // Sports & Fitness
  "105": "arts",     // Arts
  "110": "arts",     // Food & Drink (skip — mapped to arts as fallback)
  "111": "outdoor",  // Travel & Outdoor
  "113": "stem",     // Science & Technology
  "115": "dance",    // Fashion (dance fallback)
  "116": "language", // Community & Culture
  "117": "language", // Government & Politics (fallback)
  "11":  "arts",     // Kids & Family (will be most common)
};

// Our category → Eventbrite category IDs to query
const LOCAL_TO_EB: Record<string, string> = {
  music:    "103",
  sport:    "108",
  arts:     "105,11",
  stem:     "113",
  dance:    "105",
  language: "116",
  outdoor:  "111",
};

function radiusToMiles(meters: number): number {
  return Math.round(meters / 1609);
}

function ebCategoryToLocal(categoryId?: string): ActivityCategory {
  if (!categoryId) return "arts";
  return EB_CATEGORY_MAP[categoryId] ?? "arts";
}

export async function fetchFromEventbrite(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: ActivityCategory,
  query?: string
): Promise<Activity[]> {
  if (!EB_API_KEY) {
    console.warn("No Eventbrite API key set — skipping");
    return [];
  }

  const radiusMiles = Math.max(1, radiusToMiles(radiusMeters));

  const params = new URLSearchParams({
    "location.latitude":  String(lat),
    "location.longitude": String(lng),
    "location.within":    `${radiusMiles}mi`,
    "expand":             "venue,logo",
    "page_size":          "20",
    ...(query && { q: query }),
    ...(category && LOCAL_TO_EB[category] && { categories: LOCAL_TO_EB[category] }),
    ...(!category && !query && { categories: "11,103,108,105,111,113,116" }),
  });

  console.log("[eventbrite] fetching:", `https://www.eventbriteapi.com/v3/events/search?${params}`);

  const res = await fetch(`https://www.eventbriteapi.com/v3/events/search?${params}`, {
    headers: { Authorization: `Bearer ${EB_API_KEY}` },
  });

  if (!res.ok) {
    console.error("[eventbrite] error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  console.log("[eventbrite] raw events count:", data.events?.length ?? 0, "pagination:", data.pagination);

  return (data.events ?? [])
    .filter((e: any) => e.venue?.latitude && e.venue?.longitude)
    .map((e: any): Activity => ({
      id:           `eb-${e.id}`,
      name:         e.name?.text ?? "Unnamed Event",
      category:     ebCategoryToLocal(e.category_id),
      address:      [e.venue?.address?.address_1, e.venue?.address?.city].filter(Boolean).join(", "),
      lat:          parseFloat(e.venue.latitude),
      lng:          parseFloat(e.venue.longitude),
      photoUrl:     e.logo?.url,
      website:      e.url,
      isEvent:      true,
      eventDate:    e.start?.local,
      eventEndDate: e.end?.local,
      isFree:       e.is_free ?? false,
    }));
}
