import { Activity, ActivityCategory } from "@kids-app/shared";

const OSM_QUERIES: Record<string, string[]> = {
  outdoor: [
    'node["leisure"="park"]',
    'node["leisure"="playground"]',
    'way["leisure"="park"]',
    'way["leisure"="playground"]',
  ],
  sport: [
    'node["leisure"="sports_centre"]',
    'node["leisure"="swimming_pool"]["access"!="private"]',
    'node["sport"="swimming"]',
    'way["leisure"="sports_centre"]',
  ],
  arts: [
    'node["amenity"="arts_centre"]',
    'node["leisure"="gallery"]',
  ],
  music: [
    'node["amenity"="music_school"]',
  ],
  dance: [
    'node["leisure"="dance"]',
    'node["amenity"="dance_school"]',
  ],
  stem: [
    'node["amenity"="library"]',
    'node["amenity"="community_centre"]',
  ],
  language: [
    'node["amenity"="language_school"]',
    'node["amenity"="community_centre"]',
  ],
};

const ALL_OSM_QUERIES = [
  'node["leisure"="park"]',
  'node["leisure"="playground"]',
  'way["leisure"="park"]',
  'way["leisure"="playground"]',
  'node["amenity"="library"]',
  'node["leisure"="sports_centre"]',
  'node["amenity"="arts_centre"]',
];

export async function fetchFromOSM(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: ActivityCategory
): Promise<Activity[]> {
  const queries = category ? OSM_QUERIES[category] ?? ALL_OSM_QUERIES : ALL_OSM_QUERIES;

  const unionQuery = queries.map((q) => `${q}(around:${radiusMeters},${lat},${lng});`).join("\n");
  const overpassQuery = `[out:json][timeout:10];\n(\n${unionQuery}\n);\nout center tags 30;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: overpassQuery,
    headers: { "Content-Type": "text/plain" },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return (data.elements ?? [])
    .filter((el: any) => el.tags?.name)
    .map((el: any): Activity => ({
      id: `osm-${el.type}-${el.id}`,
      name: el.tags.name,
      category: osmTagToCategory(el.tags),
      address: buildOsmAddress(el.tags),
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      website: el.tags.website,
      phoneNumber: el.tags.phone,
    }))
    .filter((a: Activity) => a.lat && a.lng);
}

function osmTagToCategory(tags: Record<string, string>): ActivityCategory {
  if (tags.amenity === "music_school") return "music";
  if (tags.leisure === "dance" || tags.amenity === "dance_school") return "dance";
  if (tags.amenity === "arts_centre" || tags.leisure === "gallery") return "arts";
  if (tags.leisure === "sports_centre" || tags.leisure === "swimming_pool") return "sport";
  if (tags.leisure === "playground") return "outdoor";
  if (tags.leisure === "park") return "outdoor";
  if (tags.amenity === "library" || tags.amenity === "community_centre") return "stem";
  return "outdoor";
}

function buildOsmAddress(tags: Record<string, string>): string {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return parts.join(", ") || "See map for location";
}
