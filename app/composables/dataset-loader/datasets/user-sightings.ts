export const DATASET_ID = "bot_user_sightings";
export const LAYER_ID = `${DATASET_ID}_layer`;

import type { DatasetPreset, DatasetLoaderResult } from "../base";
import { transformDateField } from "../base";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

export const useUserSightingsDataset = () => {
  const { loadData: loadTableData } = useSightingsTable();

  const preset: DatasetPreset = {
    id: DATASET_ID,
    label: "My Sightings",
    kind: "sightings",
    endpoint: `supabase://${DATASET_ID}`,
    layerConfig: {
      id: LAYER_ID,
      type: "point",
      config: {
        dataId: DATASET_ID,
        label: "My Sightings",
        color: [76, 154, 78], // Green color for user sightings
        columns: { lat: "lat", lng: "lng" },
        isVisible: true,
        visConfig: {
          radius: 15,
          fixedRadius: false,
          opacity: 0.9,
          outline: true,
          thickness: 2,
          filled: true,
          radiusRange: [5, 50],
          strokeColor: [255, 255, 255],
          strokeColorRange: {
            colors: ["#FFFFFF", "#000000"],
          },
        },
        // @ts-ignore
        textLabel: [
          {
            field: {
              name: "type",
              type: "string",
            },
            color: [255, 255, 255],
            size: 12,
            offset: [0, 0],
            anchor: "middle",
            alignment: "center",
          },
        ],
      },
    },
  };

  const loadData = async (): Promise<DatasetLoaderResult | null> => {
    const result = await loadTableData();
    if (!result.data.length) return null;

    // Transform data for map display
    const transformedData = result.data.map(transformDateField);

    return {
      preset,
      data: transformedData,
    };
  };

  const { data, pending, error } = useAsyncData(
    "user-sightings-map",
    loadData,
    {
      server: false,
      lazy: true,
    }
  );

  return {
    preset,
    loadData,
    data,
    pending,
    error,
  };
};
