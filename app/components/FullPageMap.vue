<script setup lang="ts">
import { useMapDatasets } from "~/composables/dataset-loader";
import { useDatasetLoaders } from "~/composables/dataset-loader/";

// Define props for dataset IDs
interface Props {
  datasetIds: string[];
}

// Define emits
interface Emits {
  datasetsLoaded: [datasetCounts: Record<string, number>];
}

const props = withDefaults(defineProps<Props>(), {
  datasetIds: () => [],
});

const emit = defineEmits<Emits>();

// async component for KeplerMap
const KeplerMap = defineAsyncComponent(
  () => import("@/components/KeplerMap.vue")
);

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

// Use the dataset IDs from props
const enabledDatasets = props.datasetIds;

const { handleMapReady, addDataset, getDatasetData, pending, error } =
  useMapDatasets(enabledDatasets);

// Get access to the raw dataset loaders to check actual data (including empty datasets)
const { allDatasets } = useDatasetLoaders();
const allDatasetsMap = allDatasets.reduce<
  Record<string, (typeof allDatasets)[number]>
>((acc, dataset) => {
  acc[dataset.preset.id] = dataset;
  return acc;
}, {});

// Watch for dataset loading changes and emit counts
watch(
  [pending],
  ([isPending]) => {
    if (!isPending) {
      // Calculate dataset counts using raw loader data (not filtered data)
      const datasetCounts: Record<string, number> = {};
      props.datasetIds.forEach((datasetId) => {
        const loader = allDatasetsMap[datasetId];
        const rawData = loader?.data?.value?.data;
        const count = rawData ? rawData.length : 0;
        datasetCounts[datasetId] = count;
      });
      emit("datasetsLoaded", datasetCounts);
    }
  },
  { immediate: true }
);

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
    <!-- Enhanced loading screen with world map background -->
    <div
      v-if="pending"
      class="min-h-[90vh] inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 z-50"
    >
      <!-- Animated world map background -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-10"
      >
        <div class="world-map-container animate-pulse-glow">
          <img
            src="/imgs/simple-world-map.svg"
            alt="World Map"
            class="w-full max-w-4xl h-auto filter grayscale opacity-60 dark:invert"
          />
        </div>
      </div>

      <!-- Loading content -->
      <div class="relative z-10 text-center px-6">
        <div class="mb-8">
          <!-- Animated loading dots -->
          <div class="flex items-center justify-center space-x-2 mb-4">
            <div class="loading-dot animate-bounce"></div>
            <div
              class="loading-dot animate-bounce"
              style="animation-delay: 0.1s"
            ></div>
            <div
              class="loading-dot animate-bounce"
              style="animation-delay: 0.2s"
            ></div>
          </div>

          <!-- Loading text -->
          <h2
            class="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-3"
          >
            Loading Wildlife Sightings
          </h2>
          <p
            class="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto"
          >
            Preparing your interactive map of barn owl observations around the
            world...
          </p>
        </div>

        <!-- Progress indicator -->
        <div class="w-64 mx-auto">
          <div
            class="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-loading-bar"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-lg text-red-500">Error loading data: {{ error }}</div>
    </div>
    <div v-else>
      <ClientOnly>
        <KeplerMap
          :mapboxApiAccessToken="mapboxAccessToken"
          :isDarkMode="$colorMode.value === 'dark'"
          :onMapReady="handleMapReady"
        />
      </ClientOnly>

      <div class="absolute top-2.5 right-16 z-10">
        <MapDatasetLoader
          @datasetLoaded="handleDatasetLoaded"
          @datasetError="handleDatasetError"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Glowing animation for the world map */
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.02);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Loading dots */
.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
}

/* Loading bar animation */
@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-loading-bar {
  animation: loading-bar 2s ease-in-out infinite;
}

/* Dark mode enhancements */
.dark .world-map-container img {
  filter: grayscale(1) invert(1) contrast(0.8);
}
</style>
