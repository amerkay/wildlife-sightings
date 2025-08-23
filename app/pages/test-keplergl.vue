<template>
  <div class="relative w-full min-h-[90vh]">
    <ClientOnly>
      <div v-if="pending" class="flex items-center justify-center h-full">
        <div class="text-lg">Loading observations...</div>
      </div>
      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div class="text-lg text-red-500">Error loading data: {{ error }}</div>
      </div>
      <KeplerMap
        v-else
        :mapboxApiAccessToken="mapboxAccessToken"
        :isDarkMode="colorMode.value === 'dark'"
        :onMapReady="handleMapReady"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { processRowObject } from "@kepler.gl/processors";

// async component for KeplerMap
const KeplerMap = defineAsyncComponent(
  () => import("~/components/kepler-map/KeplerMap.vue")
);

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

const colorMode = useColorMode();

const path = "/datasets/gbif-uk-ie-barn-owl.json";

// Fetch data from the API
const { data, pending, error } = await useFetch<any[]>(path, {
  server: false,
  lazy: true,
});

// Handle when the map is ready and we get the addDataToMap function
const handleMapReady = (addDataToMapFn: (payload: any) => void) => {
  if (data.value && data.value.length > 0) {
    addDataToMapFn({
      datasets: [
        {
          info: { label: "Barn Owl Observations", id: "barn_owl_obs" },
          data: processRowObject(data.value) ?? { fields: [], rows: [] },
        },
      ],
      options: { centerMap: false },
      config: {
        visState: {
          layers: [
            {
              id: "barn_owls_layer",
              type: "point",
              config: {
                dataId: "barn_owl_obs",
                label: "Barn Owls",
                color: [18, 147, 154],
                columns: { lat: "lat", lng: "lng" },
                isVisible: true,
                visConfig: {
                  radius: 10,
                  fixedRadius: false,
                  opacity: 0.8,
                  outline: false,
                  thickness: 2,
                  filled: true,
                  radiusRange: [0, 50],
                },
              },
            },
          ],
          filters: [
            {
              dataId: ["barn_owl_obs"],
              id: "filter_sighting_date",
              name: ["sighting_date"],
              type: "timeRange",
              value: [1600000000000, 1752962400000],
              plotType: {
                interval: "1-week",
                defaultTimeFormat: "L",
                type: "histogram",
                aggregation: "sum",
              },
              view: "enlarged",
              speed: 1,
            },
          ],
        },
        mapState: {
          bearing: 0,
          dragRotate: false,
          latitude: 52.029347152354966,
          longitude: -3.3639196875002217,
          pitch: 0,
          zoom: 4,
          isSplit: false,
        },
      },
    });
  }
};
</script>
