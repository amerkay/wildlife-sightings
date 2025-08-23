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
    const approved = data.value.filter((s) => s.status === "approved").length;
    const pending = data.value.filter((s) => s.status === "pending").length;
    const rejected = data.value.filter((s) => s.status === "rejected").length;

    return { total, approved, pending, rejected };
  });

  const hasData = computed(() => data.value.length > 0);

  const approvalRate = computed(() => {
    if (stats.value.total === 0) return 0;
    return Math.round((stats.value.approved / stats.value.total) * 100);
  });

  return {
    stats,
    hasData,
    approvalRate,
  };
};
