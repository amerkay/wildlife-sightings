<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useFormContext, Field } from "vee-validate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Icon } from "#components";
import { useColorMode, useRuntimeConfig } from "#imports";

import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

// MapLibre + Leaflet bridge (adds L.maplibreGL)
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// Geolocate control
import "leaflet.locatecontrol/dist/L.Control.Locate.css";
import { LocateControl } from "leaflet.locatecontrol";

// Mapbox SDK
import mbxClient from "@mapbox/mapbox-sdk";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

const props = withDefaults(
  defineProps<{
    name?: string;
    height?: string;
    fallbackZoom?: number;
    showReverseGeoFields?: boolean;
    defaultLat?: number;
    defaultLng?: number;
    required?: boolean;
  }>(),
  {
    name: "location",
    height: "400px",
    fallbackZoom: 12,
    showReverseGeoFields: false,
    defaultLat: 53.4808,
    defaultLng: -2.2426,
    required: false,
  }
);

// Runtime config
const config = useRuntimeConfig();
const MAPBOX_TOKEN = config.public.mapboxAccessToken as string;
const OS_API_KEY = config.public.osApiKey as string;

// Color mode
const colorMode = useColorMode();

// Center state
const centerLng = ref<number>(props.defaultLng);
const centerLat = ref<number>(props.defaultLat);
const isGeolocated = ref(false);

// UX state for geolocation
const geoState = ref<"idle" | "requesting" | "locating" | "success" | "error">(
  "idle"
);
const geoError = ref<string>("");

// Track LocateControl activation state to allow safe restarts
const locateActive = ref(false);

// Geocoding state for combobox
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
const selectedLocation = ref<any>(null);

// Debounce timer for forward geocode
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// Default/validation logic
const isAtDefault = computed(
  () =>
    Math.abs(centerLat.value - props.defaultLat) < 0.0001 &&
    Math.abs(centerLng.value - props.defaultLng) < 0.0001
);

// vee-validate context
const { setFieldValue, setFieldTouched } = useFormContext();
const field = (s: string) => `${props.name}.${s}`;

function syncFormFields(placeName?: string, county?: string) {
  if (isAtDefault.value) {
    setFieldValue(field("lat"), null);
    setFieldValue(field("lng"), null);
  } else {
    setFieldValue(field("lat"), centerLat.value);
    setFieldValue(field("lng"), centerLng.value);
  }
  setFieldTouched(field("lat"), true);
  setFieldTouched(field("lng"), true);

  if (props.showReverseGeoFields) {
    if (placeName !== undefined) setFieldValue(field("placeName"), placeName);
    if (county !== undefined) setFieldValue(field("county"), county);
  }
}

// Map + layers
const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let osGlLayer: any | null = null; // Leaflet layer wrapping MapLibre
let mapboxRasterLight: L.TileLayer | null = null;
let mapboxRasterDark: L.TileLayer | null = null;

// Basemap switching state
type BaseKind = "os" | "mapbox";
let currentBase: BaseKind | null = null;
const lastInGB = ref<boolean | null>(null);
let styleLoadToken = 0; // guards async OS style fetches

// In-flight geocode request
const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const geocoding = mbxGeocoding(baseClient);
let inflightReq: any | null = null;

// ===== Utilities =====

// GB bounds (W/S/E/N) in WGS84, for OS coverage switching
const GB_BBOX = { w: -9.01, s: 49.75, e: 2.01, n: 61.01 }; // epsg.io 27700 WGS84 bounds
const isInGreatBritain = (lng: number, lat: number) =>
  lng >= GB_BBOX.w && lng <= GB_BBOX.e && lat >= GB_BBOX.s && lat <= GB_BBOX.n;

// Zoom policy: OS OpenData up to z16; Mapbox fallback can go higher
const OS_MAX_NATIVE_ZOOM = 16; // EPSG:3857 OpenData ceiling
const OS_MIN_ZOOM = 8; // Switch to Mapbox when zooming out below this level
const MAPBOX_MAX_ZOOM = 20; // safe UI cap for fallback

// Load OS MapLibre style (light | dark) and inject API key & correct endpoints
async function loadOSStyle(theme: "light" | "dark") {
  // You can vendor these JSON files; using OS public stylesheets here.
  const styleUrl =
    theme === "dark"
      ? "https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/main/OS_VTS_3857_Dark.json"
      : "https://raw.githubusercontent.com/OrdnanceSurvey/OS-Vector-Tile-API-Stylesheets/main/OS_VTS_3857_Light.json";

  const resp = await fetch(styleUrl);
  const style = await resp.json();

  // Ensure glyphs/sprite point at OS assets (many styles already do).
  // Some styles include a {key} placeholder; we normalize.
  const withKey = (u?: string) =>
    u
      ? u.includes("key=")
        ? u.replace(/key=[^&]+/, `key=${OS_API_KEY}`)
        : `${u}${u.includes("?") ? "&" : "?"}key=${OS_API_KEY}`
      : u;

  style.glyphs = withKey(style.glyphs);
  style.sprite = withKey(style.sprite);

  // Normalize any vector sources to include ?srs=3857&key=...
  Object.values<any>(style.sources || {}).forEach((src) => {
    if (
      src.url &&
      typeof src.url === "string" &&
      src.url.includes("api.os.uk")
    ) {
      const hasSrs = src.url.includes("srs=3857");
      let u = src.url;
      if (!hasSrs) u += (u.includes("?") ? "&" : "?") + "srs=3857";
      src.url = withKey(u);
    }
    // If using `tiles` instead of `url`, inject key there as well
    if (src.tiles && Array.isArray(src.tiles)) {
      src.tiles = src.tiles.map((t: string) => withKey(t));
    }
    // Clamp vector source maxzoom to avoid premium-only levels (z>=17)
    if (src.type === "vector") {
      src.maxzoom = Math.min(
        OS_MAX_NATIVE_ZOOM,
        src.maxzoom ?? OS_MAX_NATIVE_ZOOM
      );
    }
  });

  return style;
}

async function ensureOSLayer(theme: "light" | "dark") {
  const style = await loadOSStyle(theme);
  if (!osGlLayer) {
    // Bridge MapLibre style into Leaflet
    osGlLayer = L.maplibreGL({ style });
    osGlLayer.addTo(map!);
  } else {
    // Swap style on the embedded MapLibre map
    osGlLayer.getMaplibreMap().setStyle(style);
  }
}

function ensureMapboxLayers() {
  if (!mapboxRasterLight) {
    mapboxRasterLight = L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      {
        tileSize: 256,
        attribution: "© Mapbox © OpenStreetMap",
        maxZoom: MAPBOX_MAX_ZOOM,
      }
    );
  }
  if (!mapboxRasterDark) {
    mapboxRasterDark = L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      {
        tileSize: 256,
        attribution: "© Mapbox © OpenStreetMap",
        maxZoom: MAPBOX_MAX_ZOOM,
      }
    );
  }
}

async function rebuildOSLayer(theme: "light" | "dark") {
  const myToken = ++styleLoadToken;
  const style = await loadOSStyle(theme);
  if (myToken !== styleLoadToken) return; // a newer request won
  if (map && osGlLayer && map.hasLayer(osGlLayer)) {
    map.removeLayer(osGlLayer);
  }
  // Recreate the layer with the desired style (avoids getMaplibreMap null races)
  osGlLayer = L.maplibreGL({ style });
  osGlLayer.addTo(map!);

  // Enforce OS zoom ceiling at the map level, and snap down if needed
  map!.setMaxZoom(OS_MAX_NATIVE_ZOOM);
  if (map!.getZoom() > OS_MAX_NATIVE_ZOOM) {
    map!.setZoom(OS_MAX_NATIVE_ZOOM, { animate: true });
  }
}

async function switchBaseIfNeeded(forceTheme = false) {
  if (!map) return;
  const inGB = isInGreatBritain(centerLng.value, centerLat.value);
  const zoom = map.getZoom();
  const theme: "light" | "dark" = colorMode.value === "dark" ? "dark" : "light";

  // First run: initialise
  if (currentBase === null) {
    lastInGB.value = inGB;
    if (inGB && zoom >= OS_MIN_ZOOM) {
      await rebuildOSLayer(theme);
      currentBase = "os";
    } else {
      ensureMapboxLayers();
      (theme === "dark" ? mapboxRasterDark! : mapboxRasterLight!).addTo(map!);
      currentBase = "mapbox";
      map!.setMaxZoom(MAPBOX_MAX_ZOOM);
    }
    return;
  }

  // Boundary-cross switch (GB <-> non-GB) or zoom level switch
  if (
    lastInGB.value !== inGB ||
    (inGB && currentBase === "os" && zoom < OS_MIN_ZOOM) ||
    (inGB && currentBase === "mapbox" && zoom >= OS_MIN_ZOOM)
  ) {
    // Remove current base
    if (currentBase === "os" && osGlLayer && map.hasLayer(osGlLayer)) {
      map.removeLayer(osGlLayer);
    }
    if (currentBase === "mapbox") {
      if (mapboxRasterLight && map.hasLayer(mapboxRasterLight))
        map.removeLayer(mapboxRasterLight);
      if (mapboxRasterDark && map.hasLayer(mapboxRasterDark))
        map.removeLayer(mapboxRasterDark);
    }
    // Add new base
    if (inGB && zoom >= OS_MIN_ZOOM) {
      await rebuildOSLayer(theme);
      currentBase = "os";
    } else {
      ensureMapboxLayers();
      (theme === "dark" ? mapboxRasterDark! : mapboxRasterLight!).addTo(map!);
      currentBase = "mapbox";
      map!.setMaxZoom(MAPBOX_MAX_ZOOM);
    }
    lastInGB.value = inGB;
    return;
  }
  // Same region, theme flip only
  if (forceTheme) {
    if (currentBase === "os") {
      await rebuildOSLayer(theme); // safe swap; no null getMaplibreMap
    } else {
      ensureMapboxLayers();
      // toggle which raster layer is added
      if (mapboxRasterLight && map.hasLayer(mapboxRasterLight))
        map.removeLayer(mapboxRasterLight);
      if (mapboxRasterDark && map.hasLayer(mapboxRasterDark))
        map.removeLayer(mapboxRasterDark);
      (theme === "dark" ? mapboxRasterDark! : mapboxRasterLight!).addTo(map!);
      map!.setMaxZoom(MAPBOX_MAX_ZOOM);
    }
  }
}

// ===== Geocoding helpers =====

function updateFieldsFromFeature(feature: any | undefined) {
  if (!props.showReverseGeoFields) return;

  if (!feature) {
    syncFormFields("", "");
    return;
  }
  let placeName: string = feature.place_name;
  if (feature.address && feature.text)
    placeName = `${feature.address} ${feature.text}`;

  const contexts: any[] = [feature, ...(feature.context ?? [])];
  const countyHit =
    contexts.find(
      (c) => typeof c.id === "string" && c.id.startsWith("district")
    ) ??
    contexts.find(
      (c) => typeof c.id === "string" && c.id.startsWith("region")
    ) ??
    contexts.find((c) => typeof c.id === "string" && c.id.startsWith("place"));
  const county = countyHit?.text ?? "";

  syncFormFields(placeName, county);
}

async function reverseWithSdk(lng: number, lat: number) {
  if (!props.showReverseGeoFields) return;

  if (inflightReq?.abort) {
    try {
      inflightReq.abort();
    } catch {}
  }
  inflightReq = geocoding.reverseGeocode({
    query: [lng, lat],
    limit: 1,
    language: ["en"],
    types: [
      "address",
      "place",
      "district",
      "locality",
      "neighborhood",
      "region",
      "country",
      "postcode",
    ],
  });

  try {
    const resp = await inflightReq.send();
    const feature = resp?.body?.features?.[0];
    updateFieldsFromFeature(feature);
  } catch {
    // ignore
  } finally {
    inflightReq = null;
  }
}

// ===== Map lifecycle =====

function onMoveEnd() {
  if (!map) return;
  const c = map.getCenter();
  centerLng.value = c.lng;
  centerLat.value = c.lat;
  // Only switch base if crossing GB boundary (no refresh on every move)
  switchBaseIfNeeded(false);
}

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

let locate: LocateControl | null = null;

function mountMap() {
  if (!mapEl.value) return;

  map = L.map(mapEl.value, {
    // Plugin recommendations for better sync with MapLibre
    maxBounds: [
      [180, -Infinity],
      [-180, Infinity],
    ],
    maxBoundsViscosity: 1,
    minZoom: 1,
    zoomControl: true,
    attributionControl: true,
  }).setView(
    [centerLat.value, centerLng.value],
    isGeolocated.value ? 14 : props.fallbackZoom
  );

  // Initial base (based on center + theme)
  switchBaseIfNeeded(true);

  // Move handler
  map.on("moveend", onMoveEnd);

  // Locate control (UI on map)
  locate = new LocateControl({
    position: "topright",
    flyTo: true,
    setView: "untilPan",
    keepCurrentZoomLevel: false,
    showCompass: true,
    // cacheLocation: false,
    strings: { title: "Use my current location" },
    locateOptions: {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  }).addTo(map);

  // Propagate locate events to our UX state + form
  map.on("locationfound", (ev: any) => {
    const { lng, lat } = ev.latlng;
    centerLng.value = lng;
    centerLat.value = lat;
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

// Lifecycle
onMounted(() => mountMap());

onBeforeUnmount(() => {
  if (inflightReq?.abort) {
    try {
      inflightReq.abort();
    } catch {}
  }
  if (map) {
    try {
      map.stopLocate();
    } catch {}
    map.off();
    map.remove();
    map = null;
  }
  try {
    locate?.stop();
  } catch {}
});

// Watchers
watch([centerLat, centerLng], () => {
  syncFormFields();
  if (!isAtDefault.value) reverseWithSdk(centerLng.value, centerLat.value);
});

watch(
  () => colorMode.value,
  () => {
    // Swap basemap style only; keep current base kind
    switchBaseIfNeeded(true);
  }
);

// Forward geocode for combobox
async function searchPlaces(query: string) {
  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  if (inflightReq?.abort) {
    try {
      inflightReq.abort();
    } catch {}
  }

  try {
    inflightReq = geocoding.forwardGeocode({
      query: query,
      limit: 3, // Show multiple suggestions
      language: ["en"],
      autocomplete: true,
      types: ["address", "place", "locality", "district", "postcode"],
      countries: ["gb"], // Restrict results to United Kingdom only
    });

    const resp = await inflightReq.send();
    searchResults.value = resp?.body?.features || [];
  } catch (error) {
    console.warn("Geocoding search failed:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
    inflightReq = null;
  }
}

// Handle location selection from combobox
function onLocationSelect(feature: any) {
  if (feature?.center) {
    const [lng, lat] = feature.center;
    centerLng.value = lng;
    centerLat.value = lat;
    map?.setView([lat, lng], 14, { animate: true });
    updateFieldsFromFeature(feature);
    selectedLocation.value = feature;
    // Clear search results after selection
    searchResults.value = [];
    searchQuery.value = "";
  }
}

// Debounced search for combobox
function onSearchInput(value: string) {
  searchQuery.value = value;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchPlaces(value), 300);
}
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Optional "required" label -->
    <div v-if="required">
      <Label class="text-sm font-medium leading-none">
        Move the map to refine your location selection
        <span class="text-destructive">*</span>
      </Label>
    </div>

    <!-- Location search with combobox -->
    <div
      class="space-y-4 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0"
    >
      <Combobox
        v-model="selectedLocation"
        :display-value="(location: any) => location?.place_name || ''"
        @update:model-value="onLocationSelect"
      >
        <ComboboxAnchor
          class="relative w-full max-w-xl sm:w-sm md:w-md lg:w-lg"
        >
          <!-- Search icon -->
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />

          <ComboboxInput
            :model-value="searchQuery"
            @update:model-value="onSearchInput"
            placeholder="Type to search for places..."
            class="pl-9"
          />

          <!-- Search loading indicator -->
          <div
            v-if="isSearching"
            class="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Icon
              name="lucide:loader-2"
              class="h-4 w-4 animate-spin text-muted-foreground"
            />
          </div>
        </ComboboxAnchor>

        <ComboboxList class="min-w-xs sm:w-sm md:w-md lg:w-lg" :align="'start'">
          <ComboboxEmpty>
            <div class="py-3 text-center text-sm text-muted-foreground">
              {{
                isSearching
                  ? "Searching..."
                  : searchQuery
                  ? "No places found."
                  : "Type to search for places"
              }}
            </div>
          </ComboboxEmpty>

          <ComboboxGroup v-if="searchResults.length > 0">
            <ComboboxItem
              v-for="result in searchResults"
              :key="result.id"
              :value="result"
            >
              <div class="flex flex-col flex-1 min-w-0">
                <span class="font-medium truncate">{{ result.text }}</span>
                <span class="text-sm text-muted-foreground truncate">{{
                  result.place_name
                }}</span>
              </div>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </Combobox>

      <!-- Geolocate button mirrors the map control (keyboard-friendly) -->
      <div class="space-y-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="secondary"
          @click="requestGeolocation"
          :disabled="geoState === 'requesting' || geoState === 'locating'"
          class="flex items-center gap-2 w-full sm:w-auto"
        >
          <Icon
            v-if="geoState === 'requesting' || geoState === 'locating'"
            name="lucide:loader-2"
            class="animate-spin h-4 w-4"
          />
          <Icon v-else name="lucide:map-pin" class="h-4 w-4" />
          <span v-if="geoState === 'requesting'">Requesting Permission...</span>
          <span v-else-if="geoState === 'locating'"
            >Finding Your Location...</span
          >
          <span v-else-if="geoState === 'success'">Location Found!</span>
          <span v-else>Use Current Location</span>
        </Button>

        <p
          v-if="geoState === 'error' && geoError"
          class="text-sm text-destructive"
        >
          {{ geoError }}
        </p>
      </div>
    </div>

    <!-- Map -->
    <div
      class="relative isolate rounded-xl overflow-hidden border"
      :style="`width: 100%; height: ${height}; min-height: ${height};`"
    >
      <div ref="mapEl" :style="`height: ${height}; width: 100%;`" />

      <!-- Centered pin overlay (always above map panes) -->
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
          class="absolute top-[calc(50%+16px)] h-2 w-2 rounded-full bg-black/30"
        ></span>

        <!-- Optional: visible coordinates chip (keeps SR-only region too) -->
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2">
          <div
            class="pointer-events-none rounded-full px-2 py-1 text-xs bg-background/80 backdrop-blur border shadow"
          >
            {{ centerLat.toFixed(5) }}, {{ centerLng.toFixed(5) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden lat/lng fields for validation -->
    <Field :name="`${name}.lat`" v-slot="{ field, errorMessage }">
      <input type="hidden" v-bind="field" />
      <p v-if="errorMessage" class="text-sm text-destructive mt-2">
        {{ errorMessage }}
      </p>
    </Field>
    <Field :name="`${name}.lng`" v-slot="{ field }">
      <input type="hidden" v-bind="field" />
    </Field>

    <!-- Optional reverse-geocoded text fields -->
    <div
      v-if="showReverseGeoFields"
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div class="space-y-2">
        <Label :for="`${name}-place`">Place Name / Road Number</Label>
        <Field :name="`${name}.placeName`" v-slot="{ field, errorMessage }">
          <Input
            :id="`${name}-place`"
            placeholder="e.g. A9 near Kinbuck"
            v-bind="field"
          />
          <p v-if="errorMessage" class="text-sm text-destructive mt-1">
            {{ errorMessage }}
          </p>
        </Field>
      </div>

      <div class="space-y-2">
        <Label :for="`${name}-county`">County</Label>
        <Field :name="`${name}.county`" v-slot="{ field, errorMessage }">
          <Input
            :id="`${name}-county`"
            placeholder="Auto-filled (edit if needed)"
            v-bind="field"
          />
          <p v-if="errorMessage" class="text-sm text-destructive mt-1">
            {{ errorMessage }}
          </p>
        </Field>
      </div>
    </div>

    <!-- SR-only live region -->
    <div class="sr-only" aria-live="polite">
      Selected coordinates: {{ centerLat.toFixed(6) }},
      {{ centerLng.toFixed(6) }}
    </div>
  </div>
</template>
