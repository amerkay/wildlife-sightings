<script setup lang="ts">
import { RadioGroup } from "~/components/ui/radio-group";
import { RadioCard } from "~/components/ui/radio-card";

interface Props {
  modelValue: "live" | "site" | "dead";
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: Props["modelValue"]): void;
}>();
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-medium">Type of Sighting</h2>
    <RadioGroup
      :model-value="props.modelValue"
      @update:model-value="(value: string) => emit('update:modelValue', value as Props['modelValue'])"
      class="grid gap-3 sm:grid-cols-3"
    >
      <RadioCard
        value="live"
        :selected="props.modelValue"
        label="Random sighting 🦉"
      />
      <RadioCard
        value="site"
        :selected="props.modelValue"
        label="Roost / nest site 🪺"
      />
      <RadioCard
        value="dead"
        :selected="props.modelValue"
        label="Dead owl ⚰️"
      />
    </RadioGroup>
  </section>
</template>
