<script setup lang="ts">
import Container from "~/components/base/Container.vue";
import SightingsTable from "~/components/SightingsTable.vue";

// Page metadata
useHead({
  title: "My Sightings",
});
</script>

<template>
  <Container>
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
