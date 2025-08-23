import { watch, ref } from "vue";
import type { Ref } from "vue";
import * as L from "leaflet";
import {
  getMarkerColor,
  getStatusColor,
  getTypeLabel,
  formatSightingDate,
  capitalizeFirst,
} from "~/components/location-table/sighting-utils";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"] & {
  lat: number;
  lng: number;
};

interface MarkerInteractionCallbacks {
  onMarkerHover?: (sightingId: string | null) => void;
  onMarkerClick?: (sightingId: string | null) => void;
}

/**
 * Composable for managing sighting markers on a Leaflet map
 */
export const useSightingMarkers = (
  getMap: () => L.Map | null,
  data: Ref<Sighting[]>,
  callbacks?: MarkerInteractionCallbacks
) => {
  let markersLayer: L.LayerGroup | null = null;
  // Store markers by sighting ID for easy access
  const markersMap = new Map<string, L.Marker>();

  /**
   * Create a custom marker icon for a sighting type
   */
  const createMarkerIcon = (type: string) => {
    const color = getMarkerColor(type);
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
   * Create a highlighted marker icon for hover/selection states
   */
  const createHighlightedMarkerIcon = (type: string) => {
    const color = getMarkerColor(type);
    return L.divIcon({
      className: "custom-marker highlighted",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          transform: scale(1.1);
          z-index: 1000;
        "></div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
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
              background-color: ${getStatusColor(status)}20;
              color: ${getStatusColor(status)};
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
    markersMap.clear();

    // Add new markers
    data.value.forEach((sighting) => {
      if (sighting.lat && sighting.lng && sighting.id) {
        const marker = L.marker([sighting.lat, sighting.lng], {
          icon: createMarkerIcon(sighting.type || "live"),
        });

        // Add interaction handlers
        marker.on("mouseover", () => {
          callbacks?.onMarkerHover?.(sighting.id);
        });

        marker.on("mouseout", () => {
          callbacks?.onMarkerHover?.(null);
        });

        marker.on("click", () => {
          callbacks?.onMarkerClick?.(sighting.id);
        });

        marker.bindPopup(createPopupContent(sighting));
        markersLayer!.addLayer(marker);

        // Store marker for easy access
        markersMap.set(sighting.id, marker);
      }
    });

    // Fit map to show all markers if there are any
    if (markersLayer.getLayers().length > 0) {
      const group = L.featureGroup(markersLayer.getLayers() as L.Layer[]);
      map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 7 });
    }
  };

  /**
   * Clear all markers
   */
  const clearMarkers = () => {
    if (markersLayer) {
      markersLayer.clearLayers();
    }
    markersMap.clear();
  };

  /**
   * Open popup for a specific sighting
   */
  const openSightingPopup = (sightingId: string) => {
    const marker = markersMap.get(sightingId);
    if (marker) {
      marker.openPopup();
    }
  };

  /**
   * Close all popups
   */
  const closeAllPopups = () => {
    const map = getMap();
    if (map) {
      map.closePopup();
    }
  };

  /**
   * Highlight a specific marker
   */
  const highlightMarker = (sightingId: string | null) => {
    // Reset all markers to normal style
    markersMap.forEach((marker, id) => {
      const sighting = data.value.find((s) => s.id === id);
      if (sighting) {
        marker.setIcon(createMarkerIcon(sighting.type || "live"));
      }
    });

    // Highlight the selected marker
    if (sightingId) {
      const marker = markersMap.get(sightingId);
      const sighting = data.value.find((s) => s.id === sightingId);
      if (marker && sighting) {
        marker.setIcon(createHighlightedMarkerIcon(sighting.type || "live"));
      }
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
    markersMap.clear();
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
    openSightingPopup,
    closeAllPopups,
    highlightMarker,
  };
};
