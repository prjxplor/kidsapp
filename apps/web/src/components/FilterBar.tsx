"use client";

import { SearchFilters } from "@kids-app/shared";
import { ACTIVITY_CATEGORIES } from "@kids-app/shared";

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

const RADIUS_OPTIONS = [
  { label: "1 km",  value: 1000  },
  { label: "5 km",  value: 5000  },
  { label: "10 km", value: 10000 },
  { label: "20 km", value: 20000 },
];

export default function FilterBar({ filters, onChange }: Props) {
  const toggleCategory = (value: string) => {
    onChange({ ...filters, category: filters.category === value ? undefined : (value as any) });
  };

  return (
    <div className="space-y-4">
      {/* Category cards — matching the reference grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ACTIVITY_CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              className={`flex flex-col items-center justify-center gap-2 bg-white rounded-xl border p-4 transition hover:shadow-sm ${
                isActive ? "border-gray-900 shadow-sm" : "border-gray-200"
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-xs font-semibold ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Radius + open now row */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filters.radiusMeters}
          onChange={(e) => onChange({ ...filters, radiusMeters: Number(e.target.value) })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>Within {r.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <span
            onClick={() => onChange({ ...filters, openNow: filters.openNow ? undefined : true })}
            className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${filters.openNow ? "bg-gray-900" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${filters.openNow ? "translate-x-4" : "translate-x-0"}`} />
          </span>
          Open now
        </label>
      </div>
    </div>
  );
}
