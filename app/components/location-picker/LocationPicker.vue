<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { Label } from "@/components/ui/label";
import { Icon } from "#components";
import LocationPickerMap from "./LocationPickerMap.vue";
import LocationSearch from "./LocationSearch.vue";
import GeolocationButton from "./GeolocationButton.vue";
import LocationFields from "./LocationFields.vue";
import { useLocationForm } from "./composables/useLocationForm";
import { useGeocoding } from "./composables/useGeocoding";
import { useWaterValidation } from "./composables/useWaterValidation";

const props = withDefaults(
  defineProps<{
    name?: string;
    height?: string;
    fallbackZoom?: number;
    defaultLat?: number;
    defaultLng?: number;
    required?: boolean;
  }>(),
  {
    name: "location",
    height: "400px",
    fallbackZoom: 12,
    defaultLat: 53.4808,
    defaultLng: -2.2426,
    required: false,
  }
);

// Reactive center coordinates
const centerLng = ref<number>(props.defaultLng);
const centerLat = ref<number>(props.defaultLat);

// Composables
const { syncFormFields, updateWaterValidation, isAtDefault } = useLocationForm(
  centerLat,
  centerLng,
  {
    name: props.name,
    defaultLat: props.defaultLat,
    defaultLng: props.defaultLng,
  }
);

const { cleanup: cleanupGeocoding } = useGeocoding();
const { validationState, validationResult, validateLocation, resetValidation } =
  useWaterValidation();

// Geolocation state (managed by LocationPickerMap)
const isGeolocated = ref(false);
const geoState = ref<"idle" | "requesting" | "locating" | "success" | "error">(
  "idle"
);
const geoError = ref("");

// Map component reference
const mapRef = ref<InstanceType<typeof LocationPickerMap> | null>(null);

// Handle map move events
function onMapMoveEnd(coords: { lat: number; lng: number }) {
  centerLat.value = coords.lat;
  centerLng.value = coords.lng;

  // Trigger water validation
  validateLocation(coords.lng, coords.lat);
}

// Handle location found from geolocation
function onLocationFound(coords: { lat: number; lng: number }) {
  centerLat.value = coords.lat;
  centerLng.value = coords.lng;
  isGeolocated.value = true;

  // Trigger water validation
  validateLocation(coords.lng, coords.lat);
}

// Handle location selection from search
function onLocationSelect(feature: any) {
  if (feature?.center) {
    const [lng, lat] = feature.center;
    centerLng.value = lng;
    centerLat.value = lat;

    // Trigger water validation
    validateLocation(lng, lat);
  }
}

// Handle geolocation button click
function onRequestLocation() {
  mapRef.value?.requestGeolocation();
}

// Handle geolocation state changes from map
function onGeoStateChange(
  state: "idle" | "requesting" | "locating" | "success" | "error"
) {
  geoState.value = state;
  // Update isGeolocated when state becomes success
  if (state === "success") {
    isGeolocated.value = true;
  }
}

function onGeoErrorChange(error: string) {
  geoError.value = error;
}

// Watchers
watch([centerLat, centerLng], () => {
  syncFormFields();
});

// Watch validation result and update form
watch(
  () => validationResult.value,
  (result) => {
    updateWaterValidation(result.isValid);
  },
  { deep: true }
);

// Cleanup
onBeforeUnmount(() => {
  cleanupGeocoding();
  resetValidation();
});
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Optional required label -->
    <div v-if="required">
      <Label class="text-sm font-medium leading-none">
        Move the map to refine your location selection
        <span class="text-destructive">*</span>
      </Label>
    </div>

    <!-- Location search and geolocation controls -->
    <div
      class="space-y-4 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0"
    >
      <LocationSearch @location-select="onLocationSelect" />
      <GeolocationButton
        :geo-state="geoState"
        :geo-error="geoError"
        @request-location="onRequestLocation"
      />
    </div>

    <!-- Interactive map -->
    <LocationPickerMap
      ref="mapRef"
      :center-lat="centerLat"
      :center-lng="centerLng"
      :height="height"
      :fallback-zoom="fallbackZoom"
      :is-geolocated="isGeolocated"
      @move-end="onMapMoveEnd"
      @location-found="onLocationFound"
      @geo-state-change="onGeoStateChange"
      @geo-error-change="onGeoErrorChange"
    />

    <!-- Water validation Loading status -->
    <div
      v-if="validationState === 'checking'"
      class="flex items-center gap-2 text-muted-foreground"
    >
      <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
      <span>Checking location...</span>
    </div>

    <!-- Form fields -->
    <LocationFields :name="name" />

    <!-- SR-only live region -->
    <div class="sr-only" aria-live="polite">
      Selected coordinates: {{ centerLat.toFixed(6) }},
      {{ centerLng.toFixed(6) }}
    </div>
  </div>
</template>
