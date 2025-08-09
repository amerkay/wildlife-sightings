import type { DatasetPreset, DatasetLoaderResult } from "./base";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

export const useUserSightingsDataset = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const preset: DatasetPreset = {
    id: "bot_user_sightings",
    label: "My Sightings",
    kind: "sightings",
    endpoint: "supabase://bot_user_sightings",
    layerConfig: {
      id: "bot_user_sightings_layer",
      type: "point",
      config: {
        dataId: "bot_user_sightings",
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
    if (!user.value) return null;

    const { data, error } = await supabase
      .from("sightings")
      .select(`id, created_at, status, lat, lng, sighting_date`)
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user sightings:", error);
      throw error;
    }

    // Transform sighting_date to UTC string for consistency
    const transformedData =
      data?.map((sighting: Sighting) => ({
        ...sighting,
        sighting_date: sighting.sighting_date
          ? new Date(sighting.sighting_date).toISOString()
          : null,
      })) || [];

    return {
      preset,
      data: transformedData,
    };
  };

  const { data, pending, error } = useAsyncData("user-sightings-map", loadData);

  return {
    preset,
    loadData,
    data,
    pending,
    error,
  };
};
