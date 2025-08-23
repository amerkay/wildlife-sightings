<script setup lang="ts">
interface Props {
  species: string;
}

const props = defineProps<Props>();

const getSpeciesLabel = (species: string) => {
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
    {{ getSpeciesLabel(species) }}
  </div>
</template>
