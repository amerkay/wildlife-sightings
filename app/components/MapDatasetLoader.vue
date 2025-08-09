<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { toast } from "vue-sonner";

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

const emit = defineEmits<{
  datasetLoaded: [payload: { preset: DatasetPreset; data: any[] }];
  datasetError: [error: any];
}>();

const supabase = useSupabaseClient();

const presets = ref<DatasetPreset[]>([
  {
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
  },
  {
    id: "public_sightings",
    label: "Public Sightings",
    kind: "sightings",
    endpoint: "supabase://sightings_public",
    layerConfig: {
      id: "public_sightings_layer",
      type: "cluster",
      config: {
        dataId: "public_sightings",
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
  },
  // Future datasets can be added here
]);

const loading = ref(false);
const loadedDatasets = ref<Set<string>>(new Set());

const availablePresets = computed(() =>
  presets.value.filter((p) => !loadedDatasets.value.has(p.id))
);

async function onSelect(preset: DatasetPreset) {
  if (loading.value || loadedDatasets.value.has(preset.id)) return;

  loading.value = true;
  toast(`Loading ${preset.label}…`);

  try {
    let data: any[];

    if (preset.endpoint.startsWith("supabase://")) {
      // Handle Supabase queries
      const viewName = preset.endpoint.replace("supabase://", "");

      if (viewName === "sightings_public") {
        const { data: supabaseData, error } = await supabase
          .from("sightings_public")
          .select("*, lat, lng");

        if (error) {
          console.error("Error fetching public sightings:", error);
          throw error;
        }

        data =
          supabaseData
            ?.map((item: any) => ({
              ...item,
              sighting_date: item.sighting_date
                ? new Date(item.sighting_date).toISOString()
                : null,
            }))
            .filter((item: any) => item.lat !== null && item.lng !== null) ||
          [];
      } else {
        throw new Error(`Unknown Supabase view: ${viewName}`);
      }
    } else {
      // Handle regular API endpoints
      data = await $fetch<any[]>(preset.endpoint);

      // Transform data to ensure consistent date format
      data = data.map((item: any) => ({
        ...item,
        sighting_date: item.sighting_date
          ? typeof item.sighting_date === "number"
            ? new Date(item.sighting_date).toISOString()
            : new Date(item.sighting_date).toISOString()
          : null,
      }));
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      toast.error("No data found", {
        description: `${preset.label} contains no records`,
      });
      return;
    }

    loadedDatasets.value.add(preset.id);
    emit("datasetLoaded", { preset, data });

    toast.success("Dataset loaded", {
      description: `${preset.label} (${data.length} records)`,
    });
  } catch (error) {
    console.error(`Error loading ${preset.label}:`, error);
    emit("datasetError", error);
    toast.error("Failed to load dataset", {
      description: `Could not load ${preset.label}`,
    });
  } finally {
    loading.value = false;
  }
}

function resetLoadedDatasets() {
  loadedDatasets.value.clear();
}

defineExpose({
  resetLoadedDatasets,
});
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="loading || availablePresets.length === 0"
      >
        {{ loading ? "Loading..." : "Add Dataset" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <Command>
        <CommandInput placeholder="Search datasets…" />
        <CommandGroup heading="Available Datasets">
          <CommandItem
            v-for="dataset in availablePresets"
            :key="dataset.id"
            :value="dataset.id"
            @select="onSelect(dataset)"
            class="cursor-pointer"
          >
            {{ dataset.label }}
            <Badge class="ml-auto" variant="secondary">
              {{ dataset.kind }}
            </Badge>
          </CommandItem>
          <div
            v-if="availablePresets.length === 0"
            class="p-2 text-sm text-muted-foreground text-center"
          >
            All datasets loaded
          </div>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</template>
