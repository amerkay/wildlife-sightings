import type { DatasetPreset, DatasetLoaderResult } from "./base";
import { transformDateField } from "./base";

export const useGbifBarnOwlDataset = () => {
  const preset: DatasetPreset = {
    id: "gbif_barn_owl_obs",
    label: "GBIF Barn Owl Observations",
    kind: "observations",
    endpoint: "/api/observations",
    layerConfig: {
      id: "gbif_barn_owl_obs_layer",
      type: "heatmap",
      config: {
        dataId: "gbif_barn_owl_obs",
        label: "GBIF Barn Owl Observations",
        color: [18, 147, 154],
        columns: { lat: "lat", lng: "lng" },
        isVisible: true,
        visConfig: {
          opacity: 0.6,
          radius: 8,
          colorRange: {
            colors: [
              "#4C0035",
              "#880030",
              "#B72F15",
              "#D6610A",
              "#EF9100",
              "#FFC300",
            ],
            name: "Global Warming",
            type: "sequential",
            category: "Uber",
          },
        },
      },
    },
  };

  const loadData = async (): Promise<DatasetLoaderResult> => {
    const data = await $fetch<any[]>(preset.endpoint);

    // Transform data to ensure consistent date format
    const transformedData = data.map(transformDateField);

    return {
      preset,
      data: transformedData,
    };
  };

  const { data, pending, error } = useAsyncData("gbif-barn-owl-map", loadData);

  return {
    preset,
    loadData,
    data,
    pending,
    error,
  };
};
