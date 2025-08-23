import { ref, onMounted, onBeforeUnmount } from "vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapBaselayers } from "~/composables/useMapBaselayers";

interface UseLeafletMapOptions {
  /** Default map center coordinates [lat, lng] */
  center?: [number, number];
  /** Default zoom level */
  zoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Minimum zoom level */
  minZoom?: number;
}

/**
 * Composable for managing Leaflet map instance and lifecycle
 */
export const useLeafletMap = (options: UseLeafletMapOptions = {}) => {
  const {
    center = [53.4808, -2.2426], // UK center
    zoom = 6,
    maxZoom = 18,
    minZoom = 1,
  } = options;

  // Map DOM element and instance
  const mapEl = ref<HTMLDivElement | null>(null);
  let map: L.Map | null = null;

  // Composables
  const { initializeBaselayers, setupThemeWatcher } = useMapBaselayers();

  /**
   * Initialize the Leaflet map
   */
  const initializeMap = () => {
    if (!mapEl.value) return null;

    map = L.map(mapEl.value, {
      maxBounds: [
        [180, -Infinity],
        [-180, Infinity],
      ],
      maxBoundsViscosity: 1,
      minZoom,
      maxZoom,
      zoomControl: true,
      attributionControl: false,
    }).setView(center, zoom);

    // Initialize map layers and theme
    initializeBaselayers(map);
    setupThemeWatcher();

    return map;
  };

  /**
   * Clean up map resources
   */
  const destroyMap = () => {
    if (map) {
      map.off();
      map.remove();
      map = null;
    }
  };

  /**
   * Get the current map instance
   */
  const getMap = () => map;

  /**
   * Set map view to specific coordinates
   */
  const setView = (coordinates: [number, number], zoomLevel?: number) => {
    if (map) {
      map.setView(coordinates, zoomLevel || zoom);
    }
  };

  /**
   * Fit map to bounds
   */
  const fitBounds = (bounds: L.LatLngBounds, options?: L.FitBoundsOptions) => {
    if (map) {
      map.fitBounds(bounds, options);
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    initializeMap();
  });

  onBeforeUnmount(() => {
    destroyMap();
  });

  return {
    mapEl,
    getMap,
    setView,
    fitBounds,
    initializeMap,
    destroyMap,
  };
};
