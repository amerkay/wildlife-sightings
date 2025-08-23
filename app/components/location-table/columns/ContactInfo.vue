<script setup lang="ts">
interface Props {
  name: string;
  email: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="space-y-0.5">
    <div class="font-medium">{{ name }}</div>
    <div class="text-xs text-muted-foreground">{{ email }}</div>
  </div>
</template>
