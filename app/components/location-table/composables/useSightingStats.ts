import { computed } from "vue";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"] & {
  lat: number;
  lng: number;
};

/**
 * Composable for computing sighting statistics
 */
export const useSightingStats = (data: Ref<Sighting[]>) => {
  const stats = computed(() => {
    const total = data.value.length;
    const live = data.value.filter((s) => s.type === "live").length;
    const dead = data.value.filter((s) => s.type === "dead").length;
    const site = data.value.filter((s) => s.type === "site").length;

    return { total, live, dead, site };
  });

  const hasData = computed(() => data.value.length > 0);

  return {
    stats,
    hasData,
  };
};
