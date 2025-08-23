<template>
  <Container>
    <!-- Header -->
    <div class="md:flex md:justify-between md:items-start mb-10">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Admin: All Sightings</h1>
        <p class="text-muted-foreground">
          Manage all wildlife sightings. You can approve, reject, or delete any
          sighting.
        </p>
      </div>

      <div class="flex items-center gap-3 mt-4 sm:mt-0">
        <NuxtLink to="/admin/map">
          <Button variant="outline">
            <Icon name="lucide:map" size="20" />
            View all on Map
          </Button>
        </NuxtLink>
        <NuxtLink to="/my/sightings/new">
          <Button>New Sighting</Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Sightings Table -->
    <SightingsTable
      title=""
      description=""
      :show-new-sighting-button="false"
      :show-view-on-map-button="true"
      map-route="/public-barn-owl-map"
      :is-admin-mode="true"
      :external-data="sightingsData"
    />
  </Container>
</template>

<script setup>
// Use the shared data composable to sync between table and map
const sightingsData = useSightingsData({ isAdminMode: true });
</script>
