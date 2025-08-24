<script setup lang="ts">
interface Props {
  type: string;
  species?: string;
}

const props = defineProps<Props>();

const getTypeLabel = (type: string) => {
  switch (type) {
    case "live":
      return "Live Sighting";
    case "site":
      return "Roost/Nest";
    case "dead":
      return "Dead Sighting";
    default:
      return type;
  }
};

const getSpeciesLabel = (species?: string) => {
  switch (species) {
    case "barn":
      return "Barn Owl";
    case "little":
      return "Little Owl";
    default:
      return species;
  }
};
</script>

<template>
  <div class="font-medium">
    <p class="text-xs text-muted-foreground mb-1 font-bold">
      {{ getSpeciesLabel(species) }}
    </p>
    <p>
      {{ getTypeLabel(type) }}
    </p>
  </div>
</template>
