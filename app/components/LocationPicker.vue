<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useFormContext, Field } from "vee-validate";
import {
  MapboxMap,
  MapboxNavigationControl,
  MapboxGeocoder,
} from "@studiometa/vue-mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css";

import mbxClient from "@mapbox/mapbox-sdk";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mapboxgl from "mapbox-gl";

const props = withDefaults(
  defineProps<{
    /** Base path for vee-validate fields (e.g. location.lat). */
    name?: string;
    /** Map height CSS. */
    height?: string;
    /** Default zoom if geolocation is blocked/denied. */
    fallbackZoom?: number;
    /** Show reverse geocoding fields and enable reverse geocoding API calls. */
    showReverseGeoFields?: boolean;
    /** Default latitude (Manchester fallback). */
    defaultLat?: number;
    /** Default longitude (Manchester fallback). */
    defaultLng?: number;
    /** Whether location selection is required. */
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

/** Nuxt public runtime config for Mapbox token */
const config = useRuntimeConfig();
const MAPBOX_TOKEN = config.public.mapboxAccessToken as string;

/** Map + geolocation state */
const centerLng = ref<number>(props.defaultLng);
const centerLat = ref<number>(props.defaultLat);
const isGeolocated = ref(false);

/** Check if current position is at default */
const isAtDefault = computed(
  () =>
    Math.abs(centerLat.value - props.defaultLat) < 0.0001 &&
    Math.abs(centerLng.value - props.defaultLng) < 0.0001
);

/** Map instance */
const mapInstance = ref<any>(null);
/** Native Mapbox GeolocateControl */
const geoControl = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true, timeout: 10000 },
  trackUserLocation: false, // Don't continuously track - just get location once
  fitBoundsOptions: { maxZoom: 15 },
});

/** vee-validate context */
const { setFieldValue, setFieldTouched } = useFormContext();
const field = (suffix: string) => `${props.name}.${suffix}`;

/** Sync form fields - only set lat/lng if not at default position */
function syncFormFields(placeName?: string, county?: string) {
  if (isAtDefault.value) {
    // Keep lat/lng null when at default position for validation
    setFieldValue(field("lat"), null);
    setFieldValue(field("lng"), null);
  } else {
    setFieldValue(field("lat"), centerLat.value);
    setFieldValue(field("lng"), centerLng.value);
  }

  // Mark fields as touched to trigger validation
  setFieldTouched(field("lat"), true);
  setFieldTouched(field("lng"), true);

  if (props.showReverseGeoFields) {
    if (placeName !== undefined) setFieldValue(field("placeName"), placeName);
    if (county !== undefined) setFieldValue(field("county"), county);
  }
}

/** Watch for position changes and sync form */
watch(
  [centerLat, centerLng],
  () => {
    syncFormFields();
    if (!isAtDefault.value) {
      reverseWithSdk(centerLng.value, centerLat.value);
    }
  },
  { immediate: true }
);

/** =========================
 *  Mapbox SDK: Geocoding client
 *  ========================= */
const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const geocoding = mbxGeocoding(baseClient);

/** Track in-flight request so we can abort between pans */
let inflightReq: any | null = null;

/** Parse geocoder feature into your two text fields */
function updateFieldsFromFeature(feature: any | undefined) {
  if (!props.showReverseGeoFields) return;

  if (!feature) {
    syncFormFields("", "");
    return;
  }
  // Compact label when address+street are present
  let placeName: string = feature.place_name;
  if (feature.address && feature.text)
    placeName = `${feature.address} ${feature.text}`;

  // County-esque extraction (district → region → place)
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

/** Reverse geocode current center using the SDK (maintained library) */
async function reverseWithSdk(lng: number, lat: number) {
  if (!props.showReverseGeoFields) return;

  // Cancel an older lookup if still running
  if (inflightReq?.abort) {
    try {
      inflightReq.abort();
    } catch {}
  }

  inflightReq = geocoding.reverseGeocode({
    query: [lng, lat],
    limit: 1,
    language: ["en"],
    // Allowed reverse types (v5/v6 compatible set; POIs intentionally excluded)
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
  } catch (_) {
    // Keep current state on error
  } finally {
    inflightReq = null;
  }
}

/** Map events */
function onMapCreated(map: any) {
  mapInstance.value = map;
  map.addControl(geoControl, "top-right");
  geoControl.on("geolocate", (ev) => {
    console.debug("GeolocateControl geolocate event", ev);
    onUserGeolocate(ev);
  });
  geoControl.on("error", (err) => console.debug("GeolocateControl error", err));
}

function onMapLoaded() {
  requestGeolocation();
}

function onMoveEnd() {
  if (!mapInstance.value) return;
  const c = mapInstance.value.getCenter();
  centerLng.value = c.lng;
  centerLat.value = c.lat;
}

/** Geolocate success (from the control) */
function onUserGeolocate(ev: any) {
  const coords = ev?.coords ?? ev;
  if (!coords?.longitude || !coords?.latitude) return;
  centerLng.value = coords.longitude;
  centerLat.value = coords.latitude;
  isGeolocated.value = true;
}

/** Button: trigger native Mapbox geolocation control */
function requestGeolocation() {
  geoControl.trigger();
}

onBeforeUnmount(() => {
  if (inflightReq?.abort) {
    try {
      inflightReq.abort();
    } catch {}
  }
});
</script>

<template>
  <div class="w-full space-y-4">
    <div>
      <Button type="button" variant="secondary" @click="requestGeolocation">
        📍 Use My Current Location
      </Button>
    </div>

    <!-- Location selection label -->
    <div v-if="required">
      <Label class="text-sm font-medium leading-none">
        Move the map to refine your location selecton
        <span class="text-destructive">*</span>
      </Label>
    </div>

    <!-- Map -->
    <div
      class="relative rounded-xl overflow-hidden border"
      :style="`width: 100%; height: ${height}; min-height: ${height};`"
    >
      <ClientOnly>
        <MapboxMap
          :access-token="MAPBOX_TOKEN"
          :map-style="
            $colorMode.value === 'dark'
              ? 'mapbox://styles/mapbox/dark-v11'
              : 'mapbox://styles/mapbox/streets-v12'
          "
          :center="[centerLng, centerLat]"
          :zoom="isGeolocated ? 15 : fallbackZoom"
          :style="`height: ${height}; width: 100%;`"
          @mb-created="onMapCreated"
          @mb-load="onMapLoaded"
          @mb-moveend="onMoveEnd"
        >
          <MapboxGeocoder
            :collapsed="true"
            :clearOnBlur="true"
            :marker="false"
            types="address,place,postcode,locality,district"
            countries="GB"
            :limit="10"
            placeholder="Search for an address or place..."
          />
          <MapboxNavigationControl position="top-right" />
        </MapboxMap>

        <!-- Centered pin overlay -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 grid place-items-center -mt-10"
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
        </div>
      </ClientOnly>
    </div>

    <!-- Hidden lat/lng fields (kept in sync via setFieldValue) -->
    <Field :name="`${name}.lat`" v-slot="{ field, errorMessage }">
      <input type="hidden" v-bind="field" />
      <!-- Show error only for lat field to avoid duplication -->
      <p v-if="errorMessage" class="text-sm text-destructive mt-2">
        {{ errorMessage }}
      </p>
    </Field>
    <Field :name="`${name}.lng`" v-slot="{ field }">
      <input type="hidden" v-bind="field" />
      <!-- No error display for lng to avoid duplication -->
    </Field>

    <!-- Visible, auto-filled text fields -->
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
