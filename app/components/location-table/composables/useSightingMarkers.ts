import { watch } from "vue";
import * as L from "leaflet";
import {
  getMarkerColor,
  getTypeLabel,
  formatSightingDate,
  capitalizeFirst,
} from "../../../../lib/sighting-utils";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"] & {
  lat: number;
  lng: number;
};

/**
 * Composable for managing sighting markers on a Leaflet map
 */
export const useSightingMarkers = (
  getMap: () => L.Map | null,
  data: Ref<Sighting[]>
) => {
  let markersLayer: L.LayerGroup | null = null;

  /**
   * Create a custom marker icon for a sighting status
   */
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

  /**
   * Generate popup content for a sighting
   */
  const createPopupContent = (sighting: Sighting) => {
    const status = sighting.status || "pending";
    return `
      <div class="space-y-2 min-w-48">
        <div class="font-semibold">${getTypeLabel(sighting.type || "")}</div>
        <div class="text-sm">
          <div><strong>Date:</strong> ${formatSightingDate(
            sighting.sighting_date || ""
          )}</div>
          <div><strong>Status:</strong> 
            <span class="px-2 py-1 rounded text-xs" style="
              background-color: ${getMarkerColor(status)}20;
              color: ${getMarkerColor(status)};
            ">
              ${capitalizeFirst(status)}
            </span>
          </div>
          <div><strong>Contact:</strong> ${sighting.contact_name || "N/A"}</div>
          <div class="text-xs text-gray-600">
            ${sighting.lat.toFixed(6)}, ${sighting.lng.toFixed(6)}
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Initialize the markers layer
   */
  const initializeMarkersLayer = () => {
    const map = getMap();
    if (!map) return;

    if (markersLayer) {
      map.removeLayer(markersLayer);
    }

    markersLayer = L.layerGroup().addTo(map);
    updateMarkers();
  };

  /**
   * Update markers when data changes
   */
  const updateMarkers = () => {
    const map = getMap();
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add new markers
    data.value.forEach((sighting) => {
      if (sighting.lat && sighting.lng) {
        const marker = L.marker([sighting.lat, sighting.lng], {
          icon: createMarkerIcon(sighting.status || "pending"),
        });

        marker.bindPopup(createPopupContent(sighting));
        markersLayer!.addLayer(marker);
      }
    });

    // Fit map to show all markers if there are any
    if (markersLayer.getLayers().length > 0) {
      const group = L.featureGroup(markersLayer.getLayers() as L.Layer[]);
      map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 15 });
    }
  };

  /**
   * Clear all markers
   */
  const clearMarkers = () => {
    if (markersLayer) {
      markersLayer.clearLayers();
    }
  };

  /**
   * Clean up markers layer
   */
  const destroyMarkersLayer = () => {
    if (markersLayer) {
      const map = getMap();
      if (map) {
        map.removeLayer(markersLayer);
      }
      markersLayer = null;
    }
  };

  // Watch for data changes
  watch(
    () => data.value,
    () => {
      updateMarkers();
    },
    { deep: true }
  );

  return {
    initializeMarkersLayer,
    updateMarkers,
    clearMarkers,
    destroyMarkersLayer,
  };
};
