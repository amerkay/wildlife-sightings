import type { DatasetPreset, DatasetLoaderResult } from "./base";
import { transformDateField } from "./base";

export const usePublicSightingsDataset = () => {
  const supabase = useSupabaseClient();

  const preset: DatasetPreset = {
    id: "bot_public_sightings",
    label: "Barn Owl Trust - Public Sightings",
    kind: "sightings",
    endpoint: "supabase://sightings_public",
    layerConfig: {
      id: "bot_public_sightings_layer",
      type: "cluster",
      config: {
        dataId: "bot_public_sightings",
        label: "Public Sightings",
        color: [252, 242, 26],
        columns: { lat: "lat", lng: "lng" },
        isVisible: true,
        visConfig: {
          opacity: 0.7,
          clusterRadius: 40,
          radiusRange: [5, 50],
          colorRange: {
            colors: [
              "#37535E",
              "#39747F",
              "#39969B",
              "#5DB7A8",
              "#A4D4AD",
              "#E5EEC1",
            ],
            name: "Ocean Green",
            type: "sequential",
            category: "Uber",
          },
          colorAggregation: "count",
        },
      },
    },
  };

  const loadData = async (): Promise<DatasetLoaderResult> => {
    const { data: supabaseData, error } = await supabase
      .from("sightings_public")
      .select("*, lat, lng");

    if (error) {
      console.error("Error fetching public sightings:", error);
      throw error;
    }

    const data =
      supabaseData
        ?.map(transformDateField)
        .filter((item: any) => item.lat !== null && item.lng !== null) || [];

    return {
      preset,
      data,
    };
  };

  const { data, pending, error } = useAsyncData(
    "public-sightings-map",
    loadData
  );

  return {
    preset,
    loadData,
    data,
    pending,
    error,
  };
};
