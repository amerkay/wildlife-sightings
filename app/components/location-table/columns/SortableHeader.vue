<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-vue-next";

interface Props {
  isSorted?: "asc" | "desc" | false;
  title: string;
}

interface Emits {
  (e: "toggle-sort"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <Button variant="ghost" @click="emit('toggle-sort')" class="-ml-2 !px-2">
    {{ title }}
    <ArrowUp v-if="props.isSorted === 'asc'" class="ml-2 h-4 w-4" />
    <ArrowDown v-else-if="props.isSorted === 'desc'" class="ml-2 h-4 w-4" />
    <ArrowUpDown v-else class="ml-2 h-4 w-4" />
  </Button>
</template>
