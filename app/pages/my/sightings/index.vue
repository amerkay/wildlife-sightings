<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { applyReactInVue } from "veaury";
import KeplerMap from "../../../../react_app/KeplerMap";
import { processRowObject } from "@kepler.gl/processors";
import type { Database } from "../../../../types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

interface DatasetPreset {
  id: string;
  label: string;
  kind: string;
  endpoint: string;
  layerConfig: {
    id: string;
    type: "point" | "cluster" | "heatmap";
    config: {
      dataId: string;
      label: string;
      color: [number, number, number];
      columns: { lat: string; lng: string };
      isVisible: boolean;
      visConfig: Record<string, any>;
    };
  };
}

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

const colorMode = useColorMode();
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const KeplerMapVue = applyReactInVue(KeplerMap);

// Track loaded external datasets
const externalDatasets = ref<
  Map<string, { preset: DatasetPreset; data: any[] }>
>(new Map());
let addDataToMapFunction: ((payload: any) => void) | null = null;

// Fetch user's sightings from Supabase
const { data, pending, error } = await useAsyncData(
  "user-sightings-map",
  async () => {
    if (!user.value) return [];

    const { data, error } = await supabase
      .from("sightings")
      .select(`id, created_at, status, lat, lng, sighting_date`)
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user sightings:", error);
      throw error;
    }

    // transform sighting_date to UTC string for consistency
    data.forEach((sighting: Sighting) => {
      if (sighting.sighting_date) {
        sighting.sighting_date = new Date(sighting.sighting_date).toISOString();
      }
    });

    return data as Sighting[];
  }
);

// Handle when the map is ready and we get the addDataToMap function
const handleMapReady = (addDataToMapFn: (payload: any) => void) => {
  addDataToMapFunction = addDataToMapFn;
  updateMapData();
};

// Update map with current datasets
const updateMapData = () => {
  if (!addDataToMapFunction) return;

  const datasets = [];
  const layers = [];
  const filters = [];
  const datasetIds = [];

  // Always add user sightings if available
  if (data.value && data.value.length > 0) {
    datasets.push({
      info: { label: "My Sightings", id: "user_sightings" },
      data: processRowObject(data.value) ?? { fields: [], rows: [] },
    });
    datasetIds.push("user_sightings");

    layers.push({
      id: "user_sightings_layer",
      type: "point",
      config: {
        dataId: "user_sightings",
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
    });
  }

  // Add external datasets using ES6 spread
  externalDatasets.value.forEach(({ preset, data: datasetData }) => {
    datasets.push({
      info: { label: preset.label, id: preset.id },
      data: processRowObject(datasetData) ?? { fields: [], rows: [] },
    });
    datasetIds.push(preset.id);

    // Use spread syntax to apply preset layer configuration directly
    layers.push({
      ...preset.layerConfig,
    });
  });

  // Add shared time filter if we have datasets with date data
  if (datasetIds.length > 0) {
    const fieldNames = datasetIds.map(() => "sighting_date");

    filters.push({
      dataId: datasetIds,
      id: "filter_sighting_date",
      name: fieldNames,
      type: "timeRange",
      value: [
        new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).getTime(), // 3 years ago
        Date.now(), // Now
      ],
      plotType: {
        interval: "1-week",
        defaultTimeFormat: "L",
        type: "histogram",
        aggregation: "sum",
        colorsByDataId: datasetIds.reduce((acc, id) => {
          if (id === "user_sightings") {
            acc[id] = "#4C9A4E"; // Green color for user sightings
          } else {
            const preset = externalDatasets.value.get(id)?.preset;
            if (preset) {
              const [r, g, b] = preset.layerConfig.config.color;
              acc[id] = `rgb(${r}, ${g}, ${b})`;
            }
          }
          return acc;
        }, {} as Record<string, string>),
      },
      animationWindow: "free",
      yAxis: null,
      view: "minified",
      speed: 1,
      enabled: true,
    });
  }

  // Only add data if we have at least one dataset
  if (datasets.length > 0) {
    addDataToMapFunction({
      datasets,
      options: { centerMap: true },
      config: {
        mapStyle: {
          styleType: colorMode.value === "dark" ? "dark" : "light",
        },
        visState: {
          layers,
          filters,
        },
      },
    });
  }
};

// Handle dataset loading from MapDatasetLoader
const handleDatasetLoaded = ({
  preset,
  data: datasetData,
}: {
  preset: DatasetPreset;
  data: any[];
}) => {
  externalDatasets.value.set(preset.id, { preset, data: datasetData });
  updateMapData();
};

const handleDatasetError = (error: any) => {
  console.error("Dataset loading error:", error);
};
</script>

<template>
  <div class="relative w-full min-h-[90vh]">
    <div v-if="pending" class="flex items-center justify-center h-full">
      <div class="text-lg">Loading sightings data...</div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-lg text-red-500">Error loading data: {{ error }}</div>
    </div>
    <ClientOnly v-else>
      <KeplerMapVue
        :mapboxApiAccessToken="mapboxAccessToken"
        :isDarkMode="colorMode.value === 'dark'"
        :onMapReady="handleMapReady"
      />

      <!-- Dataset Loader positioned on top of the map -->
      <div class="absolute top-2.5 right-16 z-10">
        <MapDatasetLoader
          @datasetLoaded="handleDatasetLoaded"
          @datasetError="handleDatasetError"
        />
      </div>

      <!-- Show message for users with no personal sightings -->
      <div
        v-if="!data || data.length === 0"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center z-10"
      >
        <div class="text-lg mb-4">You haven't submitted any sightings yet</div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add external datasets and submit your own sightings to see them on the
          map!
        </div>
        <Button as-child>
          <NuxtLink to="/my/sightings/new">Submit Your First Sighting</NuxtLink>
        </Button>
      </div>
    </ClientOnly>
  </div>
</template>
