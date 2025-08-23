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

// Track if Kepler.js is loaded
const keplerLoaded = ref(false);

// async component for KeplerMap
const KeplerMap = defineAsyncComponent({
  loader: () => import("~/components/kepler-map/KeplerMap.vue"),
  onError: (error) => {
    console.error("Error loading KeplerMap:", error);
  },
});

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

// Use the dataset IDs from props
const enabledDatasets = props.datasetIds;

const {
  handleMapReady: originalHandleMapReady,
  addDataset,
  pending,
  error,
} = useMapDatasets(enabledDatasets);

// Wrap the original handleMapReady to also set keplerLoaded
const handleMapReady = (addDataToMapFn: any) => {
  keplerLoaded.value = true;
  originalHandleMapReady(addDataToMapFn);
};

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
    <!-- Loading screen with world map background -->
    <MapLoadingScreen v-if="pending || !keplerLoaded" />

    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-lg text-red-500">Error loading data: {{ error }}</div>
    </div>

    <div v-if="!pending && !error">
      <ClientOnly>
        <KeplerMap
          :mapboxApiAccessToken="mapboxAccessToken"
          :isDarkMode="$colorMode.value === 'dark'"
          :onMapReady="handleMapReady"
        />
      </ClientOnly>

      <div v-if="keplerLoaded" class="absolute top-2.5 right-16 z-10">
        <MapDatasetLoader
          @datasetLoaded="handleDatasetLoaded"
          @datasetError="handleDatasetError"
        />
      </div>
    </div>
  </div>
</template>
