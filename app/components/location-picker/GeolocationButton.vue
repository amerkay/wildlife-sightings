<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Icon } from "#components";

interface Props {
  geoState: "idle" | "requesting" | "locating" | "success" | "error";
  geoError: string;
}

interface Emits {
  (e: "requestLocation"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleClick() {
  emit("requestLocation");
}
</script>

<template>
  <div class="space-y-2 w-full sm:w-auto">
    <Button
      type="button"
      variant="secondary"
      @click="handleClick"
      :disabled="
        props.geoState === 'requesting' || props.geoState === 'locating'
      "
      class="flex items-center gap-2 w-full sm:w-auto"
    >
      <Icon
        v-if="props.geoState === 'requesting' || props.geoState === 'locating'"
        name="lucide:loader-2"
        class="animate-spin h-4 w-4"
      />
      <Icon v-else name="lucide:map-pin" class="h-4 w-4" />
      <span v-if="props.geoState === 'requesting'"
        >Requesting Permission...</span
      >
      <span v-else-if="props.geoState === 'locating'"
        >Finding Your Location...</span
      >
      <span v-else-if="props.geoState === 'success'">Location Found!</span>
      <span v-else>Use Current Location</span>
    </Button>

    <p
      v-if="props.geoState === 'error' && props.geoError"
      class="text-xs text-destructive"
    >
      {{ props.geoError }}
    </p>
  </div>
</template>
