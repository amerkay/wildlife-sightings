<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapBaselayers } from "~/components/location-picker/useMapBaselayers";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"] & {
  lat: number;
  lng: number;
};

interface Props {
  data: Sighting[];
  height?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "400px",
  loading: false,
});

// Map DOM element and instance
const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;

// Composables
const { initializeBaselayers, setupThemeWatcher } = useMapBaselayers();

// Helper functions
const getMarkerColor = (status: string) => {
  switch (status) {
    case "approved":
      return "#22c55e"; // green
    case "pending":
      return "#f59e0b"; // yellow
    case "rejected":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

const createMarkerIcon = (status: string) => {
  const color = getMarkerColor(status);
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "live":
      return "Live Sighting";
    case "site":
      return "Site/Roost/Nest";
    case "dead":
      return "Dead Sighting";
    default:
      return type;
  }
};

// Update markers when data changes
const updateMarkers = () => {
  if (!map || !markersLayer) return;

  // Clear existing markers
  markersLayer.clearLayers();

  // Add new markers
  props.data.forEach((sighting) => {
    if (sighting.lat && sighting.lng) {
      const marker = L.marker([sighting.lat, sighting.lng], {
        icon: createMarkerIcon(sighting.status || "pending"),
      });

      // Create popup content
      const popupContent = `
        <div class="space-y-2 min-w-48">
          <div class="font-semibold">${getTypeLabel(sighting.type || "")}</div>
          <div class="text-sm">
            <div><strong>Date:</strong> ${formatDate(
              sighting.sighting_date || ""
            )}</div>
            <div><strong>Status:</strong> 
              <span class="px-2 py-1 rounded text-xs" style="
                background-color: ${getMarkerColor(
                  sighting.status || "pending"
                )}20;
                color: ${getMarkerColor(sighting.status || "pending")};
              ">
                ${
                  (sighting.status || "pending").charAt(0).toUpperCase() +
                  (sighting.status || "pending").slice(1)
                }
              </span>
            </div>
            <div><strong>Contact:</strong> ${
              sighting.contact_name || "N/A"
            }</div>
            <div class="text-xs text-gray-600">
              ${sighting.lat.toFixed(6)}, ${sighting.lng.toFixed(6)}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer!.addLayer(marker);
    }
  });

  // Fit map to show all markers if there are any
  if (markersLayer.getLayers().length > 0) {
    const group = L.featureGroup(markersLayer.getLayers() as L.Layer[]);
    map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 15 });
  }
};

// Initialize map
const mountMap = () => {
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
  }).setView([53.4808, -2.2426], 6); // Default to UK center

  // Initialize composables
  initializeBaselayers(map);
  setupThemeWatcher();

  // Create markers layer
  markersLayer = L.layerGroup().addTo(map);

  // Initial markers update
  updateMarkers();
};

// Watch for data changes
watch(
  () => props.data,
  () => {
    updateMarkers();
  },
  { deep: true }
);

onMounted(() => {
  mountMap();
});

onBeforeUnmount(() => {
  if (map) {
    map.off();
    map.remove();
    map = null;
  }
  markersLayer = null;
});

// Computed stats for display
const stats = computed(() => {
  const total = props.data.length;
  const approved = props.data.filter((s) => s.status === "approved").length;
  const pending = props.data.filter((s) => s.status === "pending").length;
  const rejected = props.data.filter((s) => s.status === "rejected").length;

  return { total, approved, pending, rejected };
});
</script>

<template>
  <div class="space-y-4">
    <!-- Map container -->
    <div
      class="relative isolate rounded-xl overflow-hidden border"
      :style="`width: 100%; height: ${height}; min-height: ${height};`"
    >
      <div ref="mapEl" :style="`height: ${height}; width: 100%;`" />

      <!-- Loading overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]"
      >
        <div class="text-center space-y-2">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
          ></div>
          <p class="text-sm text-muted-foreground">Loading sightings...</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Approved: {{ stats.approved }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Pending: {{ stats.pending }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Rejected: {{ stats.rejected }}</span>
        </div>
      </div>
      <div class="text-muted-foreground">
        Total: {{ stats.total }} sightings
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom marker styles to override Leaflet defaults */
:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}
</style>
