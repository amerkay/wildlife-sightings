export const DATASET_ID = "bot_admin_all_sightings";
export const LAYER_ID = `${DATASET_ID}_layer`;

import type { DatasetPreset, DatasetLoaderResult } from "../base";
import { transformDateField } from "../base";
import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

export const useAdminAllSightingsDataset = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const preset: DatasetPreset = {
    id: DATASET_ID,
    label: "All User Sightings (Admin)",
    kind: "sightings",
    endpoint: `supabase://${DATASET_ID}`,
    layerConfig: {
      id: LAYER_ID,
      type: "point",
      config: {
        dataId: DATASET_ID,
        label: "All User Sightings (Admin)",
        color: [220, 38, 127], // Pink/purple color for admin view
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

    // This should be protected by middleware, but double-check here
    const { data: userRole } = await useUserRole();
    if (userRole.value !== "admin") {
      throw new Error("Access denied: Admin role required");
    }

    const { data, error } = await supabase
      .from("sightings")
      .select(`id, *, lat, lng`);

    if (error) {
      console.error("Error fetching all sightings:", error);
      throw error;
    }

    // Transform sighting_date to UTC string for consistency
    const transformedData = data?.map(transformDateField) || [];

    return {
      preset,
      data: transformedData,
    };
  };

  const { data, pending, error } = useAsyncData(
    "admin-all-sightings-map",
    loadData,
    {
      server: false,
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
