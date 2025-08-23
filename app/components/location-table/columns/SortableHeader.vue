<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { ArrowUpDown } from "lucide-vue-next";

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
  <Button variant="ghost" @click="emit('toggle-sort')">
    {{ title }}
    <ArrowUpDown class="ml-2 h-4 w-4" />
  </Button>
</template>
