<script setup lang="ts">
import { RadioGroup } from "~/components/ui/radio-group";
import RadioCard from "~/components/base/RadioCard.vue";
import { SPECIES_OPTIONS } from "./constants";

interface Props {
  modelValue: "barn" | "little";
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: Props["modelValue"]): void;
}>();
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-medium">Species</h2>
    <RadioGroup
      :model-value="props.modelValue"
      @update:model-value="(value: string) => emit('update:modelValue', value as Props['modelValue'])"
      class="grid gap-3 sm:grid-cols-2"
    >
      <RadioCard
        v-for="opt in SPECIES_OPTIONS"
        :key="opt.value"
        :value="opt.value"
        :selected="props.modelValue"
        :label="opt.label"
      />
    </RadioGroup>

    <p class="text-sm text-muted-foreground">
      For help with identification see our
      <NuxtLink to="#">Identification Guide</NuxtLink>.
    </p>
  </section>
</template>
