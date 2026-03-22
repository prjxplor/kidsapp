import { Activity, ActivityCategory } from "@kids-app/shared";

const TM_API_KEY = process.env.TICKETMASTER_API_KEY;

// Ticketmaster segment/classification → our categories
const TM_SEGMENT_MAP: Record<string, ActivityCategory> = {
  "Music":           "music",
  "Sports":          "sport",
  "Arts & Theatre":  "arts",
  "Family":          "arts",
  "Miscellaneous":   "outdoor",
};

// Our category → Ticketmaster classificationName
const LOCAL_TO_TM: Record<string, string> = {
  music:    "music",
  sport:    "sports",
  arts:     "arts & theatre",
  stem:     "family",
  dance:    "arts & theatre",
  language: "family",
  outdoor:  "family",
};

function tmSegmentToLocal(segmentName?: string): ActivityCategory {
  if (!segmentName) return "arts";
  return TM_SEGMENT_MAP[segmentName] ?? "arts";
}

function radiusToMiles(meters: number): number {
  return Math.max(1, Math.round(meters / 1609));
}

export async function fetchFromTicketmaster(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: ActivityCategory,
  query?: string,
  familyOnly?: boolean
): Promise<Activity[]> {
  if (!TM_API_KEY) {
    console.warn("[ticketmaster] No API key set — skipping");
    return [];
  }

  // Events are spread out — use a much larger radius than venue searches
  const radiusMiles = Math.max(50, radiusToMiles(radiusMeters));

  const params = new URLSearchParams({
    apikey:  TM_API_KEY,
    latlong: `${lat},${lng}`,
    radius:  String(radiusMiles),
    unit:    "miles",
    size:    "40",
    sort:    "date,asc",
    ...(query && { keyword: query }),
    ...(category && LOCAL_TO_TM[category] && { classificationName: LOCAL_TO_TM[category] }),
    ...(!category && familyOnly && { classificationName: "family" }),
  });

  console.log("[ticketmaster] fetching:", `https://app.ticketmaster.com/discovery/v2/events.json?${params}`);

  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);

  if (!res.ok) {
    console.error("[ticketmaster] error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const events = data._embedded?.events ?? [];
  console.log("[ticketmaster] raw response keys:", Object.keys(data));
  console.log("[ticketmaster] events count:", events.length);
  if (events.length === 0) console.log("[ticketmaster] full response:", JSON.stringify(data).slice(0, 500));

  return events
    .filter((e: any) => {
      const venue = e._embedded?.venues?.[0];
      return venue?.location?.latitude && venue?.location?.longitude;
    })
    .map((e: any): Activity => {
      const venue = e._embedded?.venues?.[0];
      const segmentName = e.classifications?.[0]?.segment?.name;
      const image = e.images?.find((i: any) => i.ratio === "16_9" && i.width > 500) ?? e.images?.[0];
      const price = e.priceRanges?.[0];
      const address = [venue?.address?.line1, venue?.city?.name].filter(Boolean).join(", ");

      return {
        id:           `tm-${e.id}`,
        name:         e.name,
        category:     tmSegmentToLocal(segmentName),
        address,
        lat:          parseFloat(venue.location.latitude),
        lng:          parseFloat(venue.location.longitude),
        photoUrl:     image?.url,
        website:      e.url,
        isEvent:      true,
        eventDate:    e.dates?.start?.localDate,
        eventEndDate: e.dates?.end?.localDate,
        isFree:       !price,
        priceRange:   price ? `$${price.min}–$${price.max}` : undefined,
      };
    });
}
