<script setup lang="ts">
import { cn } from "~/lib/utils";

interface Props {
  modelValue: "live" | "site" | "dead";
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: Props["modelValue"]): void;
}>();

function selectType(t: Props["modelValue"]) {
  emit("update:modelValue", t);
}
function cardClasses(active: boolean) {
  return cn(
    "flex items-start gap-3 rounded-md border p-3 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    active
      ? "bg-accent border-primary ring-2 ring-primary/40"
      : "hover:bg-accent"
  );
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-medium">Type of Sighting</h2>
    <div
      role="radiogroup"
      aria-label="Type of sighting"
      class="grid gap-3 sm:grid-cols-3"
    >
      <!-- LIVE -->
      <div
        role="radio"
        :aria-checked="props.modelValue === 'live'"
        tabindex="0"
        :class="cardClasses(props.modelValue === 'live')"
        @click="selectType('live')"
        @keydown.enter.prevent="selectType('live')"
        @keydown.space.prevent="selectType('live')"
      >
        <div
          class="mt-1 size-4 rounded-full border flex items-center justify-center"
        >
          <div
            v-if="props.modelValue === 'live'"
            class="size-2 rounded-full bg-primary"
          />
        </div>
        <p class="leading-snug m-0">Random live sighting</p>
      </div>
      <!-- SITE -->
      <div
        role="radio"
        :aria-checked="props.modelValue === 'site'"
        tabindex="0"
        :class="cardClasses(props.modelValue === 'site')"
        @click="selectType('site')"
        @keydown.enter.prevent="selectType('site')"
        @keydown.space.prevent="selectType('site')"
      >
        <div
          class="mt-1 size-4 rounded-full border flex items-center justify-center"
        >
          <div
            v-if="props.modelValue === 'site'"
            class="size-2 rounded-full bg-primary"
          />
        </div>
        <p class="leading-snug m-0">Roost / nest site 🦉</p>
      </div>
      <!-- DEAD -->
      <div
        role="radio"
        :aria-checked="props.modelValue === 'dead'"
        tabindex="0"
        :class="cardClasses(props.modelValue === 'dead')"
        @click="selectType('dead')"
        @keydown.enter.prevent="selectType('dead')"
        @keydown.space.prevent="selectType('dead')"
      >
        <div
          class="mt-1 size-4 rounded-full border flex items-center justify-center"
        >
          <div
            v-if="props.modelValue === 'dead'"
            class="size-2 rounded-full bg-primary"
          />
        </div>
        <p class="leading-snug m-0">Dead owl ✝️</p>
      </div>
    </div>
  </section>
</template>
