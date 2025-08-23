<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.locatecontrol/dist/L.Control.Locate.css";
import { useMapBaselayers } from "../../composables/useMapBaselayers";
import { useGeolocation } from "./composables/useGeolocation";

interface Props {
  centerLat: number;
  centerLng: number;
  height: string;
  fallbackZoom: number;
  isGeolocated: boolean;
}

interface Emits {
  (e: "moveEnd", coords: { lat: number; lng: number }): void;
  (e: "locationFound", coords: { lat: number; lng: number }): void;
  (
    e: "geoStateChange",
    state: "idle" | "requesting" | "locating" | "success" | "error"
  ): void;
  (e: "geoErrorChange", error: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Map DOM element
const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;

// Composables
const { initializeBaselayers, setupThemeWatcher } = useMapBaselayers();
const {
  initializeGeolocation,
  requestGeolocation: requestGeo,
  cleanup: cleanupGeo,
  geoState,
  geoError,
} = useGeolocation();

// Create refs for reactive center position
const centerLat = ref(props.centerLat);
const centerLng = ref(props.centerLng);

// Track if geolocation flyTo is in progress to prevent conflicts
const isGeolocating = ref(false);

function onMoveEnd() {
  if (!map) return;
  const c = map.getCenter();
  centerLng.value = c.lng;
  centerLat.value = c.lat;
  emit("moveEnd", { lat: c.lat, lng: c.lng });
}

function onLocationFound(lng: number, lat: number) {
  isGeolocating.value = true; // Mark that geolocation flyTo is happening
  centerLng.value = lng;
  centerLat.value = lat;
  emit("locationFound", { lat, lng });

  // Clear the flag after a delay to allow flyTo animation to complete
  setTimeout(() => {
    isGeolocating.value = false;
  }, 1500); // Give flyTo animation time to complete
}

function requestGeolocation() {
  isGeolocating.value = true; // Prevent conflicts during geolocation request
  requestGeo();
}

// Watch geolocation state and emit changes
watch(
  geoState,
  (newState) => {
    emit("geoStateChange", newState);
  },
  { immediate: true }
);

watch(
  geoError,
  (newError) => {
    emit("geoErrorChange", newError);
  },
  { immediate: true }
);

function mountMap() {
  if (!mapEl.value) return;

  map = L.map(mapEl.value, {
    maxBounds: [
      [180, -Infinity],
      [-180, Infinity],
    ],
    maxBoundsViscosity: 1,
    minZoom: 1,
    zoomControl: true,
    attributionControl: false,
  }).setView(
    [props.centerLat, props.centerLng],
    props.isGeolocated ? 14 : props.fallbackZoom
  );

  // Initialize composables
  initializeBaselayers(map);
  initializeGeolocation(map, onLocationFound);

  // Setup watchers
  setupThemeWatcher();

  // Listen for map move events to reset geolocation flag when user manually moves map
  map.on("movestart", () => {
    // Reset flag if user manually starts moving the map
    if (!isGeolocating.value) return;
    setTimeout(() => {
      isGeolocating.value = false;
    }, 100);
  });

  // Move handler
  map.on("moveend", onMoveEnd);
}

// Update map view when props change
watch(
  () => [props.centerLat, props.centerLng],
  ([newLat, newLng]) => {
    // Skip manual setView if geolocation flyTo is in progress to prevent conflicts
    if (
      map &&
      typeof newLat === "number" &&
      typeof newLng === "number" &&
      !isGeolocating.value
    ) {
      map.setView([newLat, newLng], map.getZoom(), { animate: true });
      centerLat.value = newLat;
      centerLng.value = newLng;
    }
  }
);

onMounted(() => mountMap());

onBeforeUnmount(() => {
  // Reset flags
  isGeolocating.value = false;

  if (map) {
    map.off();
    map.remove();
    map = null;
  }
  cleanupGeo();
});

// Expose the request geolocation method
defineExpose({
  requestGeolocation,
});
</script>

<template>
  <div
    class="relative isolate rounded-xl overflow-hidden border"
    :style="`width: 100%; height: ${height}; min-height: ${height};`"
  >
    <div ref="mapEl" :style="`height: ${height}; width: 100%;`" />

    <!-- Centered pin overlay -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-[1000] grid place-items-center -mt-10"
    >
      <svg
        class="drop-shadow-md text-red-600"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        />
      </svg>
      <span
        class="absolute top-[calc(50%+16px)] h-2 w-2 rounded-full bg-black/30 dark:bg-white/40"
      ></span>

      <!-- Coordinates display -->
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div
          class="pointer-events-none rounded-full px-2 py-1 text-xs bg-background/80 backdrop-blur border shadow"
        >
          {{ centerLat.toFixed(5) }}, {{ centerLng.toFixed(5) }}
        </div>
      </div>
    </div>
  </div>
</template>
