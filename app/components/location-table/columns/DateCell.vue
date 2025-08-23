<script setup lang="ts">
interface Props {
  date: string;
  isSmall?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSmall: false,
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
</script>

<template>
  <div :class="{ 'text-sm': isSmall }">
    {{ formatDate(date) }}
  </div>
</template>
