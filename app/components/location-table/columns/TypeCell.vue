<script setup lang="ts">
interface Props {
  type: string;
}

const props = defineProps<Props>();

const getTypeLabel = (type: string) => {
  switch (type) {
    case "live":
      return "Live Sighting";
    case "site":
      return "Site/Roost/Nest";
    case "dead":
      return "Dead Sighting";
    default:
      return type;
  }
};
</script>

<template>
  <div class="font-medium">
    {{ getTypeLabel(type) }}
  </div>
</template>
