<script setup lang="ts">
interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
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

const statusItems = computed(() => [
  {
    label: "Approved",
    count: props.stats.approved,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  {
    label: "Pending",
    count: props.stats.pending,
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
  },
  {
    label: "Rejected",
    count: props.stats.rejected,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
  },
]);
</script>

<template>
  <div class="space-y-4 text-sm">
    <!-- Total count (optional) -->
    <div v-if="showTotal" class="text-center font-medium text-muted-foreground">
      Total: {{ stats.total }} sightings
    </div>

    <!-- Status breakdown -->
    <div
      :class="['flex', compact ? 'flex-col space-y-2' : 'flex-wrap space-x-4']"
    >
      <div
        v-for="item in statusItems"
        :key="item.label"
        :class="[
          'flex items-center',
          compact ? 'justify-between px-3 py-2 rounded-md' : 'space-x-1',
          compact ? item.bgColor : '',
        ]"
      >
        <div class="flex items-center space-x-1">
          <div :class="['w-3 h-3 rounded-full', item.color]"></div>
          <span :class="compact ? item.textColor : ''">{{ item.label }}:</span>
        </div>
        <span :class="['font-medium', compact ? item.textColor : '']">
          {{ item.count }}
        </span>
      </div>
    </div>
  </div>
</template>
