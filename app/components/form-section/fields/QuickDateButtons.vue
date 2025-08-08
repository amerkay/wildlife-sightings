<script setup lang="ts">
import { Button } from "@/components/ui/button";

interface Props {
  onToday?: () => void;
  onYesterday?: () => void;
  onSetDate?: (date: string) => void; // New prop for direct date setting
  todayLabel?: string;
  yesterdayLabel?: string;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const props = withDefaults(defineProps<Props>(), {
  todayLabel: "Today",
  yesterdayLabel: "Yesterday",
  variant: "secondary",
  size: "default",
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

function handleToday() {
  if (props.onSetDate) {
    props.onSetDate(todayStr());
  } else if (props.onToday) {
    props.onToday();
  }
}

function handleYesterday() {
  if (props.onSetDate) {
    props.onSetDate(yesterdayStr());
  } else if (props.onYesterday) {
    props.onYesterday();
  }
}

// Expose helper functions for parent components
defineExpose({
  todayStr,
  yesterdayStr,
});
</script>

<template>
  <div class="flex gap-2">
    <Button type="button" :variant="variant" :size="size" @click="handleToday">
      {{ todayLabel }}
    </Button>
    <Button
      type="button"
      :variant="variant"
      :size="size"
      @click="handleYesterday"
    >
      {{ yesterdayLabel }}
    </Button>
    <slot />
  </div>
</template>
