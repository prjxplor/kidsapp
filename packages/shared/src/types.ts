export type ActivityCategory =
  | "music"
  | "sport"
  | "arts"
  | "stem"
  | "dance"
  | "language"
  | "outdoor";

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  photoUrl?: string;
  openNow?: boolean;
  website?: string;
  phoneNumber?: string;
  ageMin?: number;
  ageMax?: number;
}

export interface SearchFilters {
  category?: ActivityCategory;
  radiusMeters: number;
  openNow?: boolean;
  ageMin?: number;
  ageMax?: number;
  venueType?: "indoor" | "outdoor";
  price?: "free" | "paid";
}

export interface UserLocation {
  lat: number;
  lng: number;
}
