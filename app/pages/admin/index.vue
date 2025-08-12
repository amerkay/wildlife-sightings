<template>
  <Container>
    <SightingsTable
      title="Admin: All Sightings"
      description="Manage all wildlife sightings. You can approve, reject, or delete any sighting."
      :show-new-sighting-button="false"
      :show-view-on-map-button="true"
      map-route="/public-barn-owl-map"
      :is-admin-mode="true"
    />
  </Container>
</template>

<script setup>
// Admin page - shows all sightings with full admin controls
definePageMeta({
  layout: "default",
  requiresAuth: true,
  requiresRole: "admin",
});
</script>
