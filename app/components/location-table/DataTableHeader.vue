<script setup lang="ts">
import { Input } from "~/components/ui/input";
import { useDebounceFn } from "@vueuse/core";

interface Props {
  searchTerm?: string;
  placeholder?: string;
  showSearch?: boolean;
}

interface Emits {
  (e: "search-change", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  searchTerm: "",
  placeholder: "Search...",
  showSearch: true,
});

const emit = defineEmits<Emits>();

const searchValue = ref(props.searchTerm);

const debouncedSearch = useDebounceFn((value: string) => {
  emit("search-change", value);
}, 300);

const handleSearchChange = (value: string | number) => {
  const stringValue = value.toString();
  searchValue.value = stringValue;
  debouncedSearch(stringValue);
};

// Watch for external changes to searchTerm
watch(
  () => props.searchTerm,
  (newValue) => {
    searchValue.value = newValue;
  }
);
</script>

<template>
  <div v-if="showSearch" class="flex items-center space-x-2">
    <Input
      :placeholder="placeholder"
      :model-value="searchValue"
      @update:model-value="handleSearchChange"
      class="max-w-sm"
    />
  </div>
</template>
