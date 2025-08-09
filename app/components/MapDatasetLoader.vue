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
import {
  useDatasetLoaders,
  type DatasetPreset,
} from "~/composables/dataset-loaders";

const emit = defineEmits<{
  datasetLoaded: [payload: { preset: DatasetPreset; data: any[] }];
  datasetError: [error: any];
}>();

const { availableDatasets } = useDatasetLoaders();

const loading = ref(false);
const loadedDatasets = ref<Set<string>>(new Set());

const availablePresets = computed(() =>
  availableDatasets
    .map((loader) => loader.preset)
    .filter((p) => !loadedDatasets.value.has(p.id))
);

async function onSelect(preset: DatasetPreset) {
  if (loading.value || loadedDatasets.value.has(preset.id)) return;

  loading.value = true;
  toast(`Loading ${preset.label}…`);

  try {
    // Find the corresponding loader
    const loader = availableDatasets.find((l) => l.preset.id === preset.id);
    if (!loader) {
      throw new Error(`No loader found for dataset: ${preset.id}`);
    }

    const result = await loader.loadData();

    if (
      !result ||
      !result.data ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      toast.error("No data found", {
        description: `${preset.label} contains no records`,
      });
      return;
    }

    loadedDatasets.value.add(preset.id);
    emit("datasetLoaded", result);

    toast.success("Dataset loaded", {
      description: `${preset.label} (${result.data.length} records)`,
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
    <PopoverContent class="w-full sm:w-sm">
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
