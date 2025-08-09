import { ref, computed, watch } from "vue";
import { processRowObject } from "@kepler.gl/processors";
import { type DatasetPreset } from "./base";
import { useDatasetLoaders } from "./index";

export const useMapDatasets = (enabledDatasetIds: string[] = []) => {
  const { gbifBarnOwl, publicSightings, userSightings } = useDatasetLoaders();
  const colorMode = useColorMode();

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
  const loading = ref(false);

  let addDataToMapFunction: ((payload: any) => void) | null = null;

  // Watch colorMode changes and update map style
  watch(
    () => colorMode.value,
    () => {
      updateMapData();
    }
  );

  // Load initial datasets based on enabledDatasetIds
  const loadInitialDatasets = async () => {
    if (enabledDatasetIds.length === 0) return;

    loading.value = true;

    for (const datasetId of enabledDatasetIds) {
      const loader = allDatasets[datasetId as keyof typeof allDatasets];
      if (!loader) continue;

      try {
        const result = await loader.loadData();
        if (result && result.data.length > 0) {
          loadedDatasets.value.set(datasetId, result);
        }
      } catch (error) {
        console.error(`Failed to load ${datasetId}:`, error);
      }
    }

    loading.value = false;
    updateMapData();
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
          mapStyle: {
            styleType: colorMode?.value === "dark" ? "dark" : "light",
          },
          visState: { layers, filters },
        },
      });
    }
  };

  const handleMapReady = (addDataToMapFn: (payload: any) => void) => {
    addDataToMapFunction = addDataToMapFn;
    loadInitialDatasets();
  };

  // Get user sightings data for template conditionals
  const userSightingsData = computed(() => {
    const userDataset = loadedDatasets.value.get("bot_user_sightings");
    return userDataset?.data || null;
  });

  const pending = computed(() => {
    return enabledDatasetIds.includes("bot_user_sightings")
      ? userSightings.pending.value
      : loading.value;
  });

  const error = computed(() => {
    return enabledDatasetIds.includes("bot_user_sightings")
      ? userSightings.error.value
      : null;
  });

  return {
    handleMapReady,
    addDataset,
    userSightingsData,
    pending,
    error,
    loading,
  };
};
