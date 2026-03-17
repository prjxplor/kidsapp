"use client";

import { useEffect, useState } from "react";
import { Activity, SearchFilters, UserLocation } from "@kids-app/shared";
import ActivityCard from "./ActivityCard";

interface Props {
  location: UserLocation;
  filters: SearchFilters;
  onActivitiesLoaded?: (activities: Activity[]) => void;
  highlightedId?: string;
}

export default function ActivityList({ location, filters, onActivitiesLoaded, highlightedId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          radius: String(filters.radiusMeters),
          ...(filters.category && { category: filters.category }),
          ...(filters.openNow && { openNow: "true" }),
        });

        const res = await fetch(`/api/activities?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setActivities(data.activities);
        onActivitiesLoaded?.(data.activities);
      } catch {
        setError("Could not load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [location, filters]);

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Popular Activities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-200" />
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 font-medium text-sm">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-900 font-semibold text-lg">No activities found nearby</p>
        <p className="text-gray-500 text-sm mt-1">Try a wider search radius or a different category</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Popular Activities</h2>
        <span className="text-sm text-gray-500">{activities.length} results</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activities.map((activity, i) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            highlighted={activity.id === highlightedId}
            index={i}
          />
        ))}
      </div>
    </>
  );
}
