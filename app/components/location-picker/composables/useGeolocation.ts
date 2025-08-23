import { ref } from "vue";
import type { Map } from "leaflet";
import { LocateControl } from "leaflet.locatecontrol";

export type GeoState = "idle" | "requesting" | "locating" | "success" | "error";

export function useGeolocation() {
  const geoState = ref<GeoState>("idle");
  const geoError = ref<string>("");
  const isGeolocated = ref(false);
  const locateActive = ref(false);

  let locate: LocateControl | null = null;
  let map: Map | null = null;

  function getGeolocationErrorMessage(error: any): string {
    const code = error?.code || error?.PERMISSION_DENIED;
    if (code === 1 || error?.message?.includes("denied")) {
      return "Location access denied. Please enable location permissions in your browser.";
    } else if (code === 2) {
      return "Location unavailable. Please check your device settings.";
    } else if (code === 3) {
      return "Location request timed out. Please try again.";
    } else {
      return "Unable to get your location. Please try again or enter manually.";
    }
  }

  function initializeGeolocation(
    mapInstance: Map,
    onLocationFound: (lng: number, lat: number) => void
  ) {
    map = mapInstance;

    locate = new LocateControl({
      position: "topright",
      flyTo: true,
      setView: "untilPan",
      keepCurrentZoomLevel: false,
      showCompass: true,
      strings: { title: "Use my current location" },
      locateOptions: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    }).addTo(map);

    // Event handlers
    map.on("locationfound", (ev: any) => {
      const { lng, lat } = ev.latlng;
      onLocationFound(lng, lat);
      isGeolocated.value = true;
      geoState.value = "success";
      geoError.value = "";
      setTimeout(() => {
        if (geoState.value === "success") geoState.value = "idle";
      }, 4000);
    });

    map.on("locationerror", (err: any) => {
      geoState.value = "error";
      geoError.value = getGeolocationErrorMessage(err);
    });

    map.on("locateactivate", () => {
      locateActive.value = true;
    });

    map.on("locatedeactivate", () => {
      locateActive.value = false;
    });
  }

  function requestGeolocation() {
    if (!map || !locate) return;

    geoState.value = "requesting";
    geoError.value = "";

    // Small delay so users see state transitions
    setTimeout(() => {
      geoState.value = "locating";
      try {
        if (locateActive.value) {
          map!.once("locatedeactivate", () => {
            requestAnimationFrame(() => locate?.start());
          });
          locate?.stop();
        } else {
          locate?.start();
        }
      } catch {}
    }, 100);
  }

  function cleanup() {
    if (map) {
      try {
        map.stopLocate();
      } catch {}
    }
    try {
      locate?.stop();
    } catch {}
    locate = null;
    map = null;
  }

  return {
    geoState,
    geoError,
    isGeolocated,
    locateActive,
    initializeGeolocation,
    requestGeolocation,
    cleanup,
  };
}
