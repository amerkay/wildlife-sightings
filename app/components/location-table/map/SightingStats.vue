<script setup lang="ts">
import { getTypeLabel } from "../sighting-utils";

interface Stats {
  total: number;
  live: number;
  dead: number;
  site: number;
}

interface Props {
  stats: Stats;
  showTotal?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTotal: false,
  compact: false,
});

const typeItems = computed(() => [
  {
    type: "live" as const,
    label: getTypeLabel("live"),
    count: props.stats.live,
    colorClass: "bg-green-500",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
  },
  {
    type: "site" as const,
    label: getTypeLabel("site"),
    count: props.stats.site,
    colorClass: "bg-blue-500",
    textClass: "text-blue-700",
    bgClass: "bg-blue-50",
  },
  {
    type: "dead" as const,
    label: getTypeLabel("dead"),
    count: props.stats.dead,
    colorClass: "bg-red-500",
    textClass: "text-red-700",
    bgClass: "bg-red-50",
  },
]);
</script>

<template>
  <div class="space-y-4 text-sm">
    <!-- Total count (optional) -->
    <div v-if="showTotal" class="text-center font-medium text-muted-foreground">
      Total: {{ stats.total }} sightings
    </div>

    <!-- Type breakdown -->
    <div
      :class="['flex', compact ? 'flex-col space-y-2' : 'flex-wrap space-x-4']"
    >
      <div
        v-for="item in typeItems"
        :key="item.type"
        :class="[
          'flex items-center',
          compact ? 'justify-between px-3 py-2 rounded-md' : 'space-x-1',
          compact ? item.bgClass : '',
        ]"
      >
        <div class="flex items-center space-x-1">
          <div :class="['w-3 h-3 rounded-full', item.colorClass]"></div>
          <span :class="compact ? item.textClass : ''">{{ item.label }}:</span>
        </div>
        <span :class="['font-medium', compact ? item.textClass : '']">
          {{ item.count }}
        </span>
      </div>
    </div>
  </div>
</template>
