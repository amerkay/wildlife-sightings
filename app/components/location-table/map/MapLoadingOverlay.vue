<script setup lang="ts">
interface Props {
  loading: boolean;
}

defineProps<Props>();
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="loading"
      class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]"
    >
      <div class="text-center space-y-2">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
        ></div>
        <p class="text-sm text-muted-foreground">Loading sightings...</p>
      </div>
    </div>
  </Transition>
</template>
