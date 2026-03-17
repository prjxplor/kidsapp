import { Activity, ActivityCategory } from "@kids-app/shared";

const FSQ_API_KEY = process.env.FOURSQUARE_API_KEY;

const FSQ_CATEGORIES: Record<string, string> = {
  music:    "12099",              // Music School
  sport:    "18000,18021,18031",  // Sports & Recreation, Martial Arts, Swim School
  arts:     "12000,12061",        // Arts & Entertainment, Art Studio
  stem:     "12076,15014",        // Schools, Tutoring/Coding
  dance:    "12070",              // Dance Studio
  language: "12076",              // Language/Education schools
  outdoor:  "16000,16032",        // Outdoors & Recreation, Park
};

const ALL_FSQ_CATEGORIES = Object.values(FSQ_CATEGORIES).join(",");

export async function fetchFromFoursquare(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: ActivityCategory,
  query?: string
): Promise<Activity[]> {
  if (!FSQ_API_KEY) {
    console.warn("No Foursquare API key set — skipping");
    return [];
  }

  // When doing a text search, don't restrict by category IDs — let Foursquare match freely
  const categories = query
    ? (category ? FSQ_CATEGORIES[category] : undefined)
    : (category ? FSQ_CATEGORIES[category] ?? ALL_FSQ_CATEGORIES : ALL_FSQ_CATEGORIES);

  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: String(Math.min(radiusMeters, 50000)),
    limit: "30",
    fields: "fsq_id,name,categories,location,geocodes,rating,photos,hours,tel,website",
    ...(categories && { categories }),
    ...(query && { query }),
  });

  const res = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
    headers: { Authorization: FSQ_API_KEY, Accept: "application/json" },
  });

  if (!res.ok) {
    console.error("Foursquare error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  console.log("[fsq] raw results count:", data.results?.length ?? 0);

  return (data.results ?? []).map((place: any): Activity => {
    const photo = place.photos?.[0];
    const photoUrl = photo ? `${photo.prefix}400x400${photo.suffix}` : undefined;

    return {
      id: `fsq-${place.fsq_id}`,
      name: place.name,
      category: fsqCategoryToLocal(place.categories?.[0]?.id),
      address: [place.location?.address, place.location?.locality].filter(Boolean).join(", "),
      lat: place.geocodes?.main?.latitude ?? place.location?.lat,
      lng: place.geocodes?.main?.longitude ?? place.location?.lng,
      rating: place.rating ? place.rating / 2 : undefined,
      openNow: place.hours?.open_now,
      photoUrl,
      website: place.website,
      phoneNumber: place.tel,
    };
  }).filter((a: Activity) => a.lat && a.lng);
}

function fsqCategoryToLocal(categoryId?: number): ActivityCategory {
  if (!categoryId) return "arts";
  const id = String(categoryId);
  if (id === "12070") return "dance";
  if (id === "12099") return "music";
  if (id.startsWith("120")) return "arts";
  if (id.startsWith("18")) return "sport";
  if (id.startsWith("16")) return "outdoor";
  if (id.startsWith("15") || id === "12076") return "stem";
  return "arts";
}
