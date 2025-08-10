export const DATASET_ID = "gbif_barn_owl_obs";
export const LAYER_ID = `${DATASET_ID}_layer`;

import type { DatasetPreset, DatasetLoaderResult } from "../base";
import { transformDateField } from "../base";

export const useGbifBarnOwlDataset = () => {
  const preset: DatasetPreset = {
    id: DATASET_ID,
    label: "GBIF Barn Owl Observations",
    kind: "observations",
    endpoint: "/datasets/gbif-uk-ie-barn-owl.json",
    layerConfig: {
      id: LAYER_ID,
      type: "heatmap",
      config: {
        dataId: DATASET_ID,
        label: "GBIF Barn Owl Observations",
        color: [255, 204, 102],
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
