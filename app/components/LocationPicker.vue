<script setup lang="ts">
import { ref, nextTick, watchEffect, onBeforeUnmount } from "vue";
import { useForm, Field } from "vee-validate";
import {
  MapboxMap,
  MapboxGeolocateControl,
  MapboxNavigationControl,
  MapboxGeocoder,
} from "@studiometa/vue-mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css";

import mbxClient from "@mapbox/mapbox-sdk";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const props = withDefaults(
  defineProps<{
    /** Base path for vee-validate fields (e.g. location.lat). */
    name?: string;
    /** Map height CSS. */
    height?: string;
    /** Default zoom if geolocation is blocked/denied. */
    fallbackZoom?: number;
  }>(),
  { name: "location", height: "400px", fallbackZoom: 12 }
);

/** Nuxt public runtime config for Mapbox token */
const config = useRuntimeConfig();
const MAPBOX_TOKEN = config.public.mapboxAccessToken as string;

/** Map + geolocation state */
const centerLng = ref<number>(7.4474); // Bern fallback
const centerLat = ref<number>(46.948);
const isGeolocated = ref(false);

/** Refs */
const mapInstance = ref<any>(null);
const geolocateRef = ref<any>(null);

/** vee-validate context */
const { setFieldValue } = useForm();
const field = (suffix: string) => `${props.name}.${suffix}`;
function syncFormFields(placeName?: string, county?: string) {
  setFieldValue(field("lat"), centerLat.value);
  setFieldValue(field("lng"), centerLng.value);
  if (placeName !== undefined) setFieldValue(field("placeName"), placeName);
  if (county !== undefined) setFieldValue(field("county"), county);
}

/** =========================
 *  Mapbox SDK: Geocoding client
 *  ========================= */
const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const geocoding = mbxGeocoding(baseClient);

/** Track in-flight request so we can abort between pans */
let inflightReq: any | null = null;

/** Parse geocoder feature into your two text fields */
function updateFieldsFromFeature(feature: any | undefined) {
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
    // Keep lat/lng synced even if lookup fails
    syncFormFields();
  } finally {
    inflightReq = null;
  }
}

/** Map events */
function onMapCreated(map: any) {
  mapInstance.value = map;
}
function onMapLoaded() {
  syncFormFields();
  // Initial reverse for the fallback center
  reverseWithSdk(centerLng.value, centerLat.value);
  tryAutoLocate();
}
function onMoveEnd() {
  if (!mapInstance.value) return;
  const c = mapInstance.value.getCenter();
  centerLng.value = c.lng;
  centerLat.value = c.lat;
  syncFormFields(); // immediately reflect coords
  reverseWithSdk(centerLng.value, centerLat.value);
}

/** Geolocate success (from the control) */
function onUserGeolocate(ev: any) {
  const coords = ev?.coords ?? ev;
  if (!coords?.longitude || !coords?.latitude) return;
  centerLng.value = coords.longitude;
  centerLat.value = coords.latitude;
  isGeolocated.value = true;
  syncFormFields();
  reverseWithSdk(centerLng.value, centerLat.value);
}

/** Best-effort auto locate on load (no user gesture required) */
const autoLocateTriggered = ref(false);
async function tryAutoLocate() {
  await nextTick();
  if (autoLocateTriggered.value || !mapInstance.value) return;
  autoLocateTriggered.value = true;

  if (!("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      centerLat.value = latitude;
      centerLng.value = longitude;
      isGeolocated.value = true;
      mapInstance.value?.flyTo({ center: [longitude, latitude], zoom: 15 });
      syncFormFields();
      reverseWithSdk(centerLng.value, centerLat.value);
    },
    () => {}, // silent fail; user can still click the button
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/** Button: use the control’s trigger (user gesture) with a navigator fallback */
function requestGeolocation() {
  const ctrl = geolocateRef.value?.control;
  if (ctrl?.trigger) {
    ctrl.trigger();
  } else if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => onUserGeolocate(pos),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
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
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="text-lg">Section 2: Location of Sighting</CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="mb-2">
        <Button type="button" variant="secondary" @click="requestGeolocation">
          📍 Use My Current Location
        </Button>
      </div>

      <!-- Map -->
      <div class="relative rounded-xl overflow-hidden border">
        <ClientOnly>
          <MapboxMap
            :access-token="MAPBOX_TOKEN"
            map-style="mapbox://styles/mapbox/streets-v12"
            :center="[centerLng, centerLat]"
            :zoom="isGeolocated ? 15 : fallbackZoom"
            :style="`height: ${height};`"
            @mb-created="onMapCreated"
            @mb-load="onMapLoaded"
            @mb-moveend="onMoveEnd"
          >
            <MapboxGeocoder
              :collapsed="true"
              :clearOnBlur="true"
              :marker="false"
              addressAccuracy="address"
              types="address,place"
              :limit="10"
              placeholder="Search for an address or place..."
            />
            <MapboxGeolocateControl
              ref="geolocateRef"
              :position-options="{ enableHighAccuracy: true, timeout: 10000 }"
              :track-user-location="false"
              :fit-bounds-options="{ maxZoom: 15 }"
              position="top-right"
              @mb-trackuserlocationgeolocate="onUserGeolocate"
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
      <Field :name="`${name}.lat`" v-slot="{ field }">
        <input type="hidden" v-bind="field" :value="centerLat" />
      </Field>
      <Field :name="`${name}.lng`" v-slot="{ field }">
        <input type="hidden" v-bind="field" :value="centerLng" />
      </Field>

      <!-- Visible, auto-filled text fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div class="space-y-2">
        <Label :for="`${name}-notes`">Location Notes</Label>
        <Field :name="`${name}.notes`" v-slot="{ field }">
          <Textarea
            :id="`${name}-notes`"
            placeholder='e.g. "In the hollow oak tree"'
            v-bind="field"
          />
        </Field>
      </div>

      <!-- SR-only live region -->
      <div class="sr-only" aria-live="polite">
        Selected coordinates: {{ centerLat.toFixed(6) }},
        {{ centerLng.toFixed(6) }}
      </div>
    </CardContent>
  </Card>
</template>
