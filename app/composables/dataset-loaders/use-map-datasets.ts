import { ref, computed, watch, onUnmounted } from "vue";
import { processRowObject } from "@kepler.gl/processors";
import { type DatasetPreset } from "./base";
import { useDatasetLoaders } from "./index";

export const useMapDatasets = (enabledDatasetIds: string[] = []) => {
  const { gbifBarnOwl, publicSightings, userSightings } = useDatasetLoaders();

  // Map of all available datasets
  const allDatasets = {
    bot_user_sightings: userSightings,
    bot_public_sightings: publicSightings,
    gbif_barn_owl_obs: gbifBarnOwl,
  };

  const loadedDatasets = ref<
    Map<string, { preset: DatasetPreset; data: any[] }>
  >(new Map());
  const externalDatasets = ref<
    Map<string, { preset: DatasetPreset; data: any[] }>
  >(new Map());

  let addDataToMapFunction: ((payload: any) => void) | null = null;

  // Load initial datasets based on enabledDatasetIds
  const loadInitialDatasets = () => {
    if (enabledDatasetIds.length === 0) return;

    // Watch for data changes and update map when datasets load
    const watchers = enabledDatasetIds
      .map((datasetId) => {
        const loader = allDatasets[datasetId as keyof typeof allDatasets];
        if (!loader) return null;

        return watch(
          [loader.data, loader.pending],
          ([data, pending]) => {
            if (!pending && data?.data && data.data.length > 0) {
              loadedDatasets.value.set(datasetId, data);
              updateMapData();
            }
          },
          { immediate: true }
        );
      })
      .filter(Boolean);

    // Clean up watchers when component unmounts
    onUnmounted(() => {
      watchers.forEach((unwatch) => unwatch && unwatch());
    });
  };

  // Add external dataset (from MapDatasetLoader)
  const addDataset = (preset: DatasetPreset, data: any[]) => {
    externalDatasets.value.set(preset.id, { preset, data });
    updateMapData();
  };

  // Update map with current datasets
  const updateMapData = () => {
    if (!addDataToMapFunction) return;

    const datasets: any[] = [];
    const layers: any[] = [];
    const filters: any[] = [];
    const datasetIds: string[] = [];

    // Add loaded datasets (user sightings, etc.)
    loadedDatasets.value.forEach(({ preset, data }) => {
      datasets.push({
        info: { label: preset.label, id: preset.id },
        data: processRowObject(data) ?? { fields: [], rows: [] },
      });
      datasetIds.push(preset.id);
      layers.push({ ...preset.layerConfig });
    });

    // Add external datasets
    externalDatasets.value.forEach(({ preset, data }) => {
      datasets.push({
        info: { label: preset.label, id: preset.id },
        data: processRowObject(data) ?? { fields: [], rows: [] },
      });
      datasetIds.push(preset.id);
      layers.push({ ...preset.layerConfig });
    });

    // Add time filter if we have datasets
    if (datasetIds.length > 0) {
      filters.push({
        dataId: datasetIds,
        id: "filter_sighting_date",
        name: datasetIds.map(() => "sighting_date"),
        type: "timeRange",
        value: [
          new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).getTime(),
          Date.now(),
        ],
        plotType: {
          interval: "1-week",
          defaultTimeFormat: "L",
          type: "histogram",
          aggregation: "sum",
          colorsByDataId: datasetIds.reduce((acc, id) => {
            const dataset =
              loadedDatasets.value.get(id) || externalDatasets.value.get(id);
            if (dataset?.preset.layerConfig.config.color) {
              const [r, g, b] = dataset.preset.layerConfig.config.color;
              acc[id] = `rgb(${r}, ${g}, ${b})`;
            }
            return acc;
          }, {} as Record<string, string>),
        },
        animationWindow: "free",
        yAxis: null,
        view: "enlarged",
        speed: 1,
        enabled: true,
      });

      addDataToMapFunction({
        datasets,
        options: { centerMap: true },
        config: {
          visState: { layers, filters },
        },
      });
    }
  };

  const handleMapReady = (addDataToMapFn: (payload: any) => void) => {
    addDataToMapFunction = addDataToMapFn;
    loadInitialDatasets();
  };

  // Get loaded dataset data by ID (for template conditionals)
  const getDatasetData = (datasetId: string) => {
    const dataset = loadedDatasets.value.get(datasetId);
    return dataset?.data || null;
  };

  const pending = computed(() => {
    // Check if any enabled dataset is still loading
    return enabledDatasetIds.some((datasetId) => {
      const loader = allDatasets[datasetId as keyof typeof allDatasets];
      return loader?.pending?.value;
    });
  });

  const error = computed(() => {
    // Return the first error from any enabled dataset
    for (const datasetId of enabledDatasetIds) {
      const loader = allDatasets[datasetId as keyof typeof allDatasets];
      if (loader?.error?.value) {
        return loader.error.value;
      }
    }
    return null;
  });

  return {
    handleMapReady,
    addDataset,
    getDatasetData,
    pending,
    error,
  };
};
