<script setup lang="ts">
import { ref } from "vue";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Icon } from "#components";
import { useGeocoding } from "./composables/useGeocoding";

interface Props {
  modelValue?: any;
}

interface Emits {
  (e: "update:modelValue", value: any): void;
  (e: "locationSelect", feature: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { searchResults, isSearching, searchPlaces } = useGeocoding();

// Local state
const searchQuery = ref("");
const selectedLocation = ref<any>(props.modelValue);

// Debounce timer
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput(value: string) {
  searchQuery.value = value;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchPlaces(value), 300);
}

function onLocationSelect(feature: any) {
  selectedLocation.value = feature;
  emit("update:modelValue", feature);
  emit("locationSelect", feature);

  // Clear search after selection
  searchResults.value = [];
  searchQuery.value = "";
}
</script>

<template>
  <Combobox
    v-model="selectedLocation"
    :display-value="(location: any) => location?.place_name || ''"
    @update:model-value="onLocationSelect"
  >
    <ComboboxAnchor class="relative w-full max-w-xl sm:w-sm md:w-md lg:w-lg">
      <!-- Search icon -->
      <Icon
        name="lucide:search"
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />

      <ComboboxInput
        :model-value="searchQuery"
        @update:model-value="onSearchInput"
        placeholder="Type to search for places..."
        class="pl-9"
      />

      <!-- Search loading indicator -->
      <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
        <Icon
          name="lucide:loader-2"
          class="h-4 w-4 animate-spin text-muted-foreground"
        />
      </div>
    </ComboboxAnchor>

    <ComboboxList class="min-w-xs sm:w-sm md:w-md lg:w-lg" :align="'start'">
      <ComboboxEmpty>
        <div class="py-3 text-center text-sm text-muted-foreground">
          {{
            isSearching
              ? "Searching..."
              : searchQuery
              ? "No places found."
              : "Type to search for places"
          }}
        </div>
      </ComboboxEmpty>

      <ComboboxGroup v-if="searchResults.length > 0">
        <ComboboxItem
          v-for="result in searchResults"
          :key="result.id"
          :value="result"
        >
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-medium truncate">{{ result.text }}</span>
            <span class="text-sm text-muted-foreground truncate">{{
              result.place_name
            }}</span>
          </div>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
