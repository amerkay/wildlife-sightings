<script setup lang="ts">
import { onMounted, toRef, nextTick, watch, computed } from "vue";
import { useLeafletMap } from "~/components/location-table/composables/useLeafletMap";
import { useSightingMarkers } from "../composables/useSightingMarkers";
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
const markersComposable = useSightingMarkers(getMap, dataRef, {
  onMarkerHover: (sightingId: string | null) =>
    emit("marker-hover", sightingId),
  onMarkerClick: (sightingId: string | null) =>
    emit("marker-click", sightingId),
});

const { initializeMarkersLayer, openSightingPopup, highlightMarker } =
  markersComposable;

// Initialize stats composable
const { stats } = useSightingStats(dataRef);

// Compute the currently active sighting (hover takes priority, fallback to selection)
const activeSightingId = computed(
  () => props.hoveredSightingId || props.selectedSightingId
);

// Initialize markers when map is ready
onMounted(() => {
  nextTick(() => {
    initializeMarkersLayer();
  });
});

// Handle active sighting changes
watch(activeSightingId, (sightingId) => {
  if (sightingId) {
    highlightMarker(sightingId);
    // Only open popup for selected sightings (persistent), not hovered ones (temporary)
    if (props.selectedSightingId === sightingId) {
      openSightingPopup(sightingId);
    }
  } else {
    highlightMarker(null);
  }
});
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
