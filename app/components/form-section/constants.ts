// Centralized form constants used across sections
// Keeping UI options and derivable enum values DRY

export const TYPE_OPTIONS = [
  { value: "live", label: "Random sighting 🦉" },
  { value: "site", label: "Roost / nest site 🪺" },
  { value: "dead", label: "Dead owl ⚰️" },
] as const;

// Live section
export const LIVE_FREQ = [
  { value: "once", label: "Just this once" },
  { value: "weekly", label: "More than once a week" },
  { value: "monthly", label: "More than once a month" },
  { value: "less-monthly", label: "Less than once a month" },
] as const;

export const LIVE_ACTIVITY = [
  { value: "driving", label: "Driving" },
  { value: "walking", label: "Walking" },
  { value: "home", label: "At home" },
  { value: "other", label: "Other" },
] as const;

// Dead section
export const DEAD_CAUSE = [
  { value: "road-minor", label: "Road Casualty - Minor Road" },
  { value: "road-major", label: "Road Casualty - Major Road (A/B road)" },
  {
    value: "road-motorway",
    label: "Road Casualty - Dual Carriageway / Motorway",
  },
  { value: "powerlines", label: "Near power lines / pylon" },
  { value: "railway", label: "Near railway line" },
  { value: "drowned", label: "Drowned (e.g., in water trough)" },
  { value: "unknown", label: "Cause not obvious / Unknown" },
  { value: "other", label: "Other" },
] as const;

// Site section
export const SITE_OBSERVED = [
  { key: "nest", label: "Nest (eggs or young seen)" },
  { key: "roost-regular", label: "Regular roost site (>10 pellets seen)" },
  {
    key: "roost-occasional",
    label: "Occasional roost site (<10 pellets seen)",
  },
  { key: "fly-in-out", label: "Owl flying into/out of the site" },
  { key: "carrying-food", label: "Owl carrying food to the site" },
  { key: "young-heard", label: "Young heard calling" },
] as const;

export const SITE_TYPES = [
  { value: "traditional-farm", label: "Traditional farm building" },
  { value: "modern-farm", label: "Modern farm building (e.g., 'Dutch' barn)" },
  { value: "mixed-farm", label: "Mix of traditional and modern buildings" },
  { value: "tree-hole", label: "Tree hole / hollow" },
  { value: "other", label: "Other" },
] as const;

export const NESTBOX_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
] as const;

export const CONNECTION_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "tenant", label: "Tenant" },
  { value: "watcher", label: "Regular watcher/visitor" },
  { value: "other", label: "Other" },
] as const;
