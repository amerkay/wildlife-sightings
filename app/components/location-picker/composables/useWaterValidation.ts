import { ref, type Ref } from "vue";
import { useRuntimeConfig } from "#imports";
import { useDebounceFn } from "@vueuse/core";

export type WaterValidationState = "idle" | "checking" | "valid" | "invalid";

export interface WaterValidationResult {
  isValid: boolean;
  message?: string;
}

export function useWaterValidation() {
  const config = useRuntimeConfig();
  const MAPBOX_TOKEN = config.public.mapboxAccessToken as string;

  const validationState = ref<WaterValidationState>("idle");
  const lastValidatedCoords = ref<{ lat: number; lng: number } | null>(null);
  const validationResult = ref<WaterValidationResult>({ isValid: true });

  /**
   * Validate if coordinates are on land using Mapbox Tilequery API
   */
  async function validateCoordinates(
    lng: number,
    lat: number
  ): Promise<WaterValidationResult> {
    if (!MAPBOX_TOKEN) {
      console.warn("Mapbox token not available for water validation");
      return { isValid: true };
    }

    try {
      const url = new URL(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json`
      );
      url.searchParams.set("layers", "water");
      url.searchParams.set("geometry", "polygon");
      url.searchParams.set("radius", "0");
      url.searchParams.set("limit", "1");
      url.searchParams.set("access_token", MAPBOX_TOKEN);

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(`Water validation API error: ${response.status}`);
        return { isValid: true }; // Fail open - don't block if API is down
      }

      const data = await response.json();
      const features = data.features || [];

      // If we have a feature with distance 0, the point is in water
      const isInWater = features.some(
        (feature: any) => feature.properties?.tilequery?.distance === 0
      );

      if (isInWater) {
        return {
          isValid: false,
          message: "Please select a location on land",
        };
      }

      return { isValid: true };
    } catch (error) {
      console.warn("Water validation failed:", error);
      return { isValid: true }; // Fail open
    }
  }

  /**
   * Debounced validation function to avoid excessive API calls
   */
  const debouncedValidate = useDebounceFn(async (lng: number, lat: number) => {
    // Skip if coordinates haven't changed significantly (within ~10m)
    if (lastValidatedCoords.value) {
      const deltaLat = Math.abs(lat - lastValidatedCoords.value.lat);
      const deltaLng = Math.abs(lng - lastValidatedCoords.value.lng);
      if (deltaLat < 0.0001 && deltaLng < 0.0001) {
        return;
      }
    }

    validationState.value = "checking";

    const result = await validateCoordinates(lng, lat);

    validationResult.value = result;
    validationState.value = result.isValid ? "valid" : "invalid";
    lastValidatedCoords.value = { lat, lng };
  }, 800);

  /**
   * Validate coordinates with debouncing
   */
  function validateLocation(lng: number, lat: number) {
    // Immediate state update for better UX
    if (validationState.value === "idle") {
      validationState.value = "checking";
    }

    debouncedValidate(lng, lat);
  }

  /**
   * Reset validation state
   */
  function resetValidation() {
    validationState.value = "idle";
    lastValidatedCoords.value = null;
    validationResult.value = { isValid: true };
  }

  /**
   * Check if current coordinates are valid for form submission
   */
  function isValidForSubmission(
    lng: number | null,
    lat: number | null
  ): boolean {
    if (lng === null || lat === null) return false;
    if (validationState.value === "checking") return false;
    return validationResult.value.isValid;
  }

  return {
    validationState,
    validationResult,
    validateLocation,
    resetValidation,
    isValidForSubmission,
  };
}
