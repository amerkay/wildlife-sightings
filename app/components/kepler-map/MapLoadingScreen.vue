<script setup lang="ts">
interface Props {
  loadingText?: string;
  loadingSubtext?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "Loading Wildlife Sightings",
  loadingSubtext:
    "Preparing your interactive map of barn owl observations around the world...",
});
</script>

<template>
  <div
    class="min-h-[90vh] inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 z-50"
  >
    <!-- Animated world map background -->
    <div
      class="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-10"
    >
      <div class="world-map-container animate-pulse-glow">
        <img
          src="/imgs/simple-world-map.svg"
          alt="World Map"
          class="w-full max-w-4xl h-auto filter grayscale opacity-60 dark:invert"
        />
      </div>
    </div>

    <!-- Loading content -->
    <div class="relative z-10 text-center px-6">
      <div class="mb-8">
        <!-- Animated loading dots -->
        <div class="flex items-center justify-center space-x-2 mb-4">
          <div class="loading-dot animate-bounce"></div>
          <div
            class="loading-dot animate-bounce"
            style="animation-delay: 0.1s"
          ></div>
          <div
            class="loading-dot animate-bounce"
            style="animation-delay: 0.2s"
          ></div>
        </div>

        <!-- Loading text -->
        <h2
          class="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-3"
        >
          {{ loadingText }}
        </h2>
        <p class="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {{ loadingSubtext }}
        </p>
      </div>

      <!-- Progress indicator -->
      <div class="w-64 mx-auto">
        <div
          class="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-loading-bar"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Glowing animation for the world map */
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.02);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Loading dots */
.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
}

/* Loading bar animation */
@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-loading-bar {
  animation: loading-bar 2s ease-in-out infinite;
}

/* Dark mode enhancements */
.dark .world-map-container img {
  filter: grayscale(1) invert(1) contrast(0.8);
}
</style>
