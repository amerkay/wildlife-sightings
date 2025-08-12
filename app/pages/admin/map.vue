<script setup lang="ts">
import { DATASET_ID as ADMIN_ALL_SIGHTINGS_DATASET_ID } from "~/composables/dataset-loader/datasets/admin-all-sightings";

const { data: userRole } = await useUserRole();

// Redirect non-admin users
if (userRole.value !== "admin") {
  throw createError({
    statusCode: 403,
    statusMessage: "Access denied: Admin role required",
  });
}

const allSightingsCount = ref<number>(0);
const datasetsLoaded = ref<boolean>(false);

const handleDatasetsLoaded = (datasetCounts: Record<string, number>) => {
  allSightingsCount.value = datasetCounts[ADMIN_ALL_SIGHTINGS_DATASET_ID] || 0;
  datasetsLoaded.value = true;
};

useHead({
  title: "Admin Map - All Sightings",
});
</script>

<template>
  <div class="relative">
    <FullPageMap
      :datasetIds="[ADMIN_ALL_SIGHTINGS_DATASET_ID]"
      @datasetsLoaded="handleDatasetsLoaded"
    />

    <!-- Admin info overlay -->
    <div
      v-if="datasetsLoaded"
      class="hidden sm:block absolute bottom-8 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10"
    >
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
        Admin View: All User Sightings
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        Total sightings: {{ allSightingsCount.toLocaleString() }}
      </div>
    </div>
  </div>
</template>
