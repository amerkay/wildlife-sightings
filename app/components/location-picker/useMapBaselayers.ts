import { watch, type Ref } from "vue";
import { useColorMode } from "#imports";
import * as L from "leaflet";
import "leaflet-providers";

/**
 * Simplified basemap composable using free CARTO basemaps
 * No API tokens required - uses CartoCDN public basemaps
 */
export function useMapBaselayers() {
  const colorMode = useColorMode();

  // State
  let map: L.Map | null = null;
  let cartoLight: L.TileLayer | null = null;
  let cartoDark: L.TileLayer | null = null;

  // Constants
  const CARTO_MAX_ZOOM = 18;

  function createCartoLayers() {
    if (!cartoLight) {
      cartoLight = L.tileLayer.provider("CartoDB.Positron");
    }

    if (!cartoDark) {
      cartoDark = L.tileLayer.provider("CartoDB.DarkMatter");
    }
  }

  function switchTheme() {
    if (!map) return;

    createCartoLayers();

    // Remove current basemap
    if (cartoLight && map.hasLayer(cartoLight)) {
      map.removeLayer(cartoLight);
    }
    if (cartoDark && map.hasLayer(cartoDark)) {
      map.removeLayer(cartoDark);
    }

    // Add appropriate basemap for current theme
    const currentLayer = colorMode.value === "dark" ? cartoDark! : cartoLight!;
    currentLayer.addTo(map);

    // Set consistent max zoom
    map.setMaxZoom(CARTO_MAX_ZOOM);
  }

  function initializeBaselayers(mapInstance: L.Map) {
    map = mapInstance;

    // Setup custom attribution control without Ukrainian flag
    const customAttribution = L.control.attribution();
    customAttribution.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    customAttribution.addTo(map);

    // Initialize with appropriate theme
    createCartoLayers();
    const initialLayer = colorMode.value === "dark" ? cartoDark! : cartoLight!;
    initialLayer.addTo(map);
    map.setMaxZoom(CARTO_MAX_ZOOM);
  }

  function setupThemeWatcher() {
    watch(
      () => colorMode.value,
      () => {
        switchTheme();
      }
    );
  }

  return {
    initializeBaselayers,
    setupThemeWatcher,
  };
}
