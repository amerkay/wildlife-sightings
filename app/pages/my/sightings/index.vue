<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { applyReactInVue } from "veaury";
import KeplerMap from "../../../../react_app/KeplerMap";
import { processRowObject } from "@kepler.gl/processors";
import type { Database } from "../../../../types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

const colorMode = useColorMode();
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const KeplerMapVue = applyReactInVue(KeplerMap);

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

    // console.log("Fetched user sightings:", data);

    return data as Sighting[];
  }
);

// Handle when the map is ready and we get the addDataToMap function
const handleMapReady = (addDataToMapFn: (payload: any) => void) => {
  if (data.value && data.value.length > 0) {
    addDataToMapFn({
      datasets: [
        {
          info: { label: "My Sightings", id: "user_sightings" },
          data: processRowObject(data.value) ?? { fields: [], rows: [] },
        },
      ],
      options: { centerMap: true, zoom: 7 },
      config: {
        mapStyle: {
          styleType: colorMode.value === "dark" ? "dark" : "light",
        },
        visState: {
          layers: [
            {
              id: "user_sightings_layer",
              type: "point",
              config: {
                dataId: "user_sightings",
                label: "My Sightings",
                color: [255, 165, 0], // Orange color to distinguish from public data
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
            },
          ],
          filters: [
            {
              dataId: ["user_sightings"],
              id: "filter_sighting_date",
              name: ["sighting_date"],
              type: "timeRange",
              value: [
                new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime(),
                Date.now(),
              ], // Last year
              plotType: {
                interval: "1-week",
                defaultTimeFormat: "L",
                type: "histogram",
                aggregation: "sum",
              },
              view: "enlarged",
              speed: 1,
            },
          ],
        },
        mapState: {
          bearing: 0,
          dragRotate: false,
          latitude: 52.029347152354966, // UK center
          longitude: -3.3639196875002217,
          pitch: 0,
          zoom: 7,
          isSplit: false,
        },
      },
    });
  }
};
</script>

<template>
  <div class="relative w-full min-h-[90vh]">
    <div v-if="pending" class="flex items-center justify-center h-full">
      <div class="text-lg">Loading your sightings...</div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-lg text-red-500">
        Error loading your sightings: {{ error }}
      </div>
    </div>
    <div
      v-else-if="!data || data.length === 0"
      class="flex items-center justify-center h-full"
    >
      <div class="text-center">
        <div class="text-lg mb-4">You haven't submitted any sightings yet</div>
        <div>{{ data }}</div>
        <Button as-child>
          <NuxtLink to="/my/sightings/new">Submit Your First Sighting</NuxtLink>
        </Button>
      </div>
    </div>
    <ClientOnly v-else>
      <KeplerMapVue
        :mapboxApiAccessToken="mapboxAccessToken"
        :isDarkMode="colorMode.value === 'dark'"
        :onMapReady="handleMapReady"
      />
    </ClientOnly>

    <!-- Floating action button for new sighting -->
    <div v-if="data && data.length > 0" class="absolute top-4 right-4 z-10">
      <Button as-child>
        <NuxtLink to="/my/sightings/new">
          <Plus class="mr-2 h-4 w-4" />
          New Sighting
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
