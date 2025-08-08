<script setup lang="ts">
import { RadioGroupItem } from "~/components/ui/radio-group";
import { cn } from "~/lib/utils";
import type { HTMLAttributes } from "vue";
import { computed } from "vue";

interface Props {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  class?: HTMLAttributes["class"];
  selected?: string; // current RadioGroup model value
  activeClass?: string; // override active styling
}

const props = defineProps<Props>();

const isActive = computed(
  () => props.selected !== undefined && props.selected === props.value
);
const activeClass = computed(
  () => props.activeClass ?? "bg-accent border-primary ring-2 ring-primary/40"
);
</script>

<template>
  <label
    :class="
      cn(
        'flex items-start gap-3 rounded-md border p-3 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isActive ? activeClass : 'hover:bg-accent',
        props.class
      )
    "
  >
    <RadioGroupItem
      :value="props.value"
      class="mt-1"
      :disabled="props.disabled"
    />
    <div class="leading-snug m-0 space-y-1">
      <p v-if="props.label" class="m-0">{{ props.label }}</p>
      <p v-if="props.description" class="m-0 text-muted-foreground text-sm">
        {{ props.description }}
      </p>
      <slot />
    </div>
  </label>
</template>
