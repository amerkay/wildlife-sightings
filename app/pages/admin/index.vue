<template>
  <Container>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Admin: All Sightings</h1>
        <p class="text-muted-foreground">
          Manage all wildlife sightings. You can approve, reject, or delete any
          sighting.
        </p>
      </div>

      <!-- Layout: Table and Map side by side on larger screens -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sightings Table -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">Sightings Data</h2>
          <SightingsTable
            title=""
            description=""
            :show-new-sighting-button="false"
            :show-view-on-map-button="true"
            map-route="/public-barn-owl-map"
            :is-admin-mode="true"
            :external-data="sightingsData"
          />
        </div>

        <!-- Sightings Map -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">Sightings Map</h2>
          <SightingsMap
            :data="currentPageData"
            :loading="isLoading"
            height="600px"
          />
        </div>
      </div>
    </div>
  </Container>
</template>

<script setup>
// Use the shared data composable to sync between table and map
const sightingsData = useSightingsData({ isAdminMode: true });

// Computed properties to ensure reactivity
const currentPageData = computed(() => sightingsData.data.value);
const isLoading = computed(() => sightingsData.pending.value);

// Admin page - shows all sightings with full admin controls
definePageMeta({
  layout: "default",
  requiresAuth: true,
  requiresRole: "admin",
});
</script>
