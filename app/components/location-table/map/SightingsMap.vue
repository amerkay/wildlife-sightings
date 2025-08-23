<script setup lang="ts">
import { onMounted, toRef, nextTick, watch } from "vue";
import { useLeafletMap } from "~/components/location-table/composables/useLeafletMap";
import { useSightingMarkers } from "~/composables/useSightingMarkers";
import { useSightingStats } from "~/components/location-table/composables/useSightingStats";
import MapLoadingOverlay from "./MapLoadingOverlay.vue";
import SightingStats from "./SightingStats.vue";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"] & {
  lat: number;
  lng: number;
};

interface Props {
  data: Sighting[];
  height?: string;
  loading?: boolean;
  showStats?: boolean;
  compactStats?: boolean;
  hoveredSightingId?: string | null;
  selectedSightingId?: string | null;
}

interface Emits {
  (e: "marker-hover", sightingId: string | null): void;
  (e: "marker-click", sightingId: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  height: "400px",
  loading: false,
  showStats: true,
  compactStats: false,
  hoveredSightingId: null,
  selectedSightingId: null,
});

const emit = defineEmits<Emits>();

// Convert props to refs for composables
const dataRef = toRef(props, "data");

// Initialize map composable
const { mapEl, getMap } = useLeafletMap({
  center: [53.4808, -2.2426], // UK center
  zoom: 6,
});

// Initialize markers composable
const { initializeMarkersLayer, openSightingPopup, highlightMarker } =
  useSightingMarkers(getMap, dataRef, {
    onMarkerHover: (sightingId: string | null) =>
      emit("marker-hover", sightingId),
    onMarkerClick: (sightingId: string | null) =>
      emit("marker-click", sightingId),
  });

// Initialize stats composable
const { stats } = useSightingStats(dataRef);

// Initialize markers when map is ready
onMounted(() => {
  // Small delay to ensure map is fully initialized
  nextTick(() => {
    initializeMarkersLayer();
  });
});

// Watch for hover state changes
watch(
  () => props.hoveredSightingId,
  (sightingId) => {
    if (sightingId) {
      highlightMarker(sightingId);
      openSightingPopup(sightingId);
    } else {
      highlightMarker(null);
    }
  }
);

// Watch for selection state changes
watch(
  () => props.selectedSightingId,
  (sightingId) => {
    if (sightingId) {
      highlightMarker(sightingId);
      openSightingPopup(sightingId);
    } else {
      highlightMarker(null);
    }
  }
);
</script>

<template>
  <div class="space-y-4">
    <!-- Map container -->
    <div
      class="relative isolate rounded-md overflow-hidden border"
      :style="`width: 100%; height: ${height}; min-height: ${height};`"
    >
      <div ref="mapEl" :style="`height: ${height}; width: 100%;`" />

      <!-- Loading overlay -->
      <MapLoadingOverlay :loading="loading" />
    </div>

    <!-- Stats -->
    <SightingStats v-if="showStats" :stats="stats" :compact="compactStats" />
  </div>
</template>

<style scoped>
/* Custom marker styles to override Leaflet defaults */
:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}
</style>
