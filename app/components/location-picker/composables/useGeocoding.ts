import { ref } from "vue";
import mbxClient from "@mapbox/mapbox-sdk";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { useRuntimeConfig } from "#imports";

export function useGeocoding() {
  const config = useRuntimeConfig();
  const MAPBOX_TOKEN = config.public.mapboxAccessToken as string;

  // Initialize Mapbox client
  const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
  const geocoding = mbxGeocoding(baseClient);

  // In-flight request tracking
  let inflightReq: any | null = null;

  // Forward geocoding for search
  const searchResults = ref<any[]>([]);
  const isSearching = ref(false);

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
        limit: 3,
        language: ["en"],
        autocomplete: true,
        types: [
          "address",
          "place",
          "locality",
          "district",
          "postcode",
          "neighborhood",
          "poi",
          "poi.landmark",
        ],
        countries: ["gb"],
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

  function cleanup() {
    if (inflightReq?.abort) {
      try {
        inflightReq.abort();
      } catch {}
      inflightReq = null;
    }
  }

  return {
    searchResults,
    isSearching,
    searchPlaces,
    cleanup,
  };
}
