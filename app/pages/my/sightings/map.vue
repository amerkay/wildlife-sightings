<script setup lang="ts">
import { DATASET_ID as USER_SIGHTINGS_DATASET_ID } from "~/composables/dataset-loader/datasets/user-sightings";

const userSightingsCount = ref<number>(0);
const datasetsLoaded = ref<boolean>(false);
const messagedismissed = ref<boolean>(false);

const handleDatasetsLoaded = (datasetCounts: Record<string, number>) => {
  userSightingsCount.value = datasetCounts[USER_SIGHTINGS_DATASET_ID] || 0;
  datasetsLoaded.value = true;
};

const dismissMessage = () => {
  messagedismissed.value = true;
};
</script>

<template>
  <div class="relative">
    <FullPageMap
      :datasetIds="[USER_SIGHTINGS_DATASET_ID]"
      @datasetsLoaded="handleDatasetsLoaded"
    />

    <!-- User-specific no sightings message -->
    <div
      v-if="datasetsLoaded && userSightingsCount === 0 && !messagedismissed"
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center z-10"
    >
      <!-- X button -->
      <button
        @click="dismissMessage"
        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        aria-label="Dismiss message"
      >
        <svg
          class="w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div class="text-lg mb-4">You haven't submitted any sightings yet</div>
      <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Submit your sightings to see them on the map! You can click "Add
        Dataset" to add curated datasets, like GBIF or other sources.
      </div>
      <Button as-child>
        <NuxtLink to="/my/sightings/new/">Submit Your First Sighting</NuxtLink>
      </Button>
    </div>
  </div>
</template>
