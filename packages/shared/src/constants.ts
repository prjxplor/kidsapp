export const ACTIVITY_CATEGORIES = [
  { value: "music",    label: "Music",    emoji: "🎵", description: "Music lessons, bands, choirs" },
  { value: "sport",    label: "Sports",   emoji: "⚽", description: "Football, swimming, martial arts" },
  { value: "arts",     label: "Arts",     emoji: "🎨", description: "Painting, sculpture, crafts" },
  { value: "stem",     label: "STEM",     emoji: "🔬", description: "Coding, robotics, science" },
  { value: "dance",    label: "Dance",    emoji: "💃", description: "Ballet, hip-hop, ballroom" },
  { value: "language", label: "Language", emoji: "🗣️", description: "French, Spanish, Mandarin" },
] as const;

export const DEFAULT_RADIUS_METERS = 5000;
export const MAX_RADIUS_METERS = 20000;
