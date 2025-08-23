<script setup lang="ts">
// Page metadata
useHead({
  title: "My Sightings",
});
</script>

<template>
  <Container>
    <!-- Header -->
    <div class="md:flex md:justify-between md:items-start mb-10">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Your Sightings</h1>
        <p class="text-muted-foreground">View all of your owl sightings.</p>
      </div>

      <div class="flex items-center gap-3 mt-4 sm:mt-0">
        <NuxtLink to="/my/sightings/map">
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

    <SightingsTable
      title="My Sightings"
      description="Manage your barn owl sightings and track their status"
      :show-new-sighting-button="true"
      :show-view-on-map-button="true"
      new-sighting-route="/my/sightings/new"
      map-route="/my/sightings/map"
      :is-admin-mode="false"
    />
  </Container>
</template>
