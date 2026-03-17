"use client";

import { Activity } from "@kids-app/shared";

interface Props {
  activity: Activity;
  highlighted?: boolean;
  index?: number;
}

const CATEGORY_STYLE: Record<string, { bg: string; light: string }> = {
  music:    { bg: "bg-pink-500",    light: "bg-pink-50"    },
  sport:    { bg: "bg-orange-500",  light: "bg-orange-50"  },
  arts:     { bg: "bg-purple-500",  light: "bg-purple-50"  },
  stem:     { bg: "bg-emerald-500", light: "bg-emerald-50" },
  dance:    { bg: "bg-fuchsia-500", light: "bg-fuchsia-50" },
  language: { bg: "bg-amber-500",   light: "bg-amber-50"   },
  outdoor:  { bg: "bg-green-500",   light: "bg-green-50"   },
};

const CATEGORY_LABEL: Record<string, string> = {
  music:    "Music",
  sport:    "Sports",
  arts:     "Arts",
  stem:     "STEM",
  dance:    "Dance",
  language: "Language",
  outdoor:  "Outdoor",
};

const CATEGORY_EMOJI: Record<string, string> = {
  music:    "🎵",
  sport:    "⚽",
  arts:     "🎨",
  stem:     "🔬",
  dance:    "💃",
  language: "🗣️",
  outdoor:  "🌿",
};

const STAGGER = ["stagger-1","stagger-2","stagger-3","stagger-4","stagger-5","stagger-6"];

export default function ActivityCard({ activity, highlighted, index = 0 }: Props) {
  const style = CATEGORY_STYLE[activity.category] ?? { bg: "bg-gray-500", light: "bg-gray-50" };
  const label = CATEGORY_LABEL[activity.category] ?? activity.category;
  const emoji = CATEGORY_EMOJI[activity.category] ?? "📍";
  const stagger = STAGGER[Math.min(index, STAGGER.length - 1)];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`;

  return (
    <div
      className={`animate-fade-up ${stagger} bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col cursor-pointer ${
        highlighted ? "ring-2 ring-gray-900 shadow-lg" : ""
      }`}
      style={{ border: highlighted ? undefined : "1.5px solid #CAF0F8" }}
    >
      {/* Photo */}
      <div className="relative h-52 flex-shrink-0 overflow-hidden">
        {activity.photoUrl ? (
          <img
            src={activity.photoUrl}
            alt={activity.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl ${style.light}`}>
            {emoji}
          </div>
        )}

        {/* Category pill — top left */}
        <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-sm ${style.bg}`}>
          {emoji} {label}
        </span>

        {/* Rating pill — bottom right */}
        {activity.rating && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full bg-white/95 text-gray-800 shadow">
            <span className="text-amber-400">★</span>
            {activity.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-2 line-clamp-2">
          {activity.name}
        </h3>

        <div className="space-y-1.5 flex-1">
          {activity.address && (
            <p className="text-xs text-gray-400 flex items-start gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="line-clamp-1">{activity.address}</span>
            </p>
          )}

          {activity.openNow !== undefined && (
            <p className={`text-xs flex items-center gap-1.5 font-semibold ${activity.openNow ? "text-green-500" : "text-red-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activity.openNow ? "bg-green-500" : "bg-red-400"}`} />
              {activity.openNow ? "Open now" : "Closed"}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View on map
          </a>

          {activity.website && (
            <a
              href={activity.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
