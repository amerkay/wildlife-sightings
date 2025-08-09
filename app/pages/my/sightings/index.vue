<script setup lang="ts">
import { applyReactInVue } from "veaury";
import KeplerMap from "../../../../react_app/KeplerMap";
import { useMapDatasets } from "~/composables/dataset-loaders";

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

const KeplerMapVue = applyReactInVue(KeplerMap);

// Configure which datasets to load - just specify the IDs!
const enabledDatasets = ["bot_user_sightings"];

const { handleMapReady, addDataset, getDatasetData, pending, error } =
  useMapDatasets(enabledDatasets);

// Get user sightings data for template conditionals
const userSightingsData = computed(() => getDatasetData("bot_user_sightings"));

// Handle dataset loading from MapDatasetLoader
const handleDatasetLoaded = ({ preset, data }: any) => {
  addDataset(preset, data);
};

const handleDatasetError = (error: any) => {
  console.error("Dataset loading error:", error);
};
</script>

<template>
  <div class="relative w-full min-h-[90vh]">
    <div v-if="pending" class="flex items-center justify-center h-full">
      <div class="text-lg">Loading sightings data...</div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-lg text-red-500">Error loading data: {{ error }}</div>
    </div>
    <ClientOnly v-else>
      <KeplerMapVue
        :mapboxApiAccessToken="mapboxAccessToken"
        :isDarkMode="$colorMode.value === 'dark'"
        :onMapReady="handleMapReady"
      />

      <div class="absolute top-2.5 right-16 z-10">
        <MapDatasetLoader
          @datasetLoaded="handleDatasetLoaded"
          @datasetError="handleDatasetError"
        />
      </div>

      <div
        v-if="!userSightingsData || userSightingsData.length === 0"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center z-10"
      >
        <div class="text-lg mb-4">You haven't submitted any sightings yet</div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add external datasets and submit your own sightings to see them on the
          map!
        </div>
        <Button as-child>
          <NuxtLink to="/my/sightings/new">Submit Your First Sighting</NuxtLink>
        </Button>
      </div>
    </ClientOnly>
  </div>
</template>
