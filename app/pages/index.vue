<template>
  <section>
    <Container class="min-h-[90vh] mx-auto py-10">
      <h1 class="text-4xl font-bold mb-2">Wildlife Sightings</h1>

      <p class="text-lg">
        <NuxtLink to="/test-keplergl"> => Test KeplerGL </NuxtLink>
      </p>

      <div class="mt-12 space-y-4 flex flex-col items-start">
        <Button @click="testSuccess">Test Success Toast</Button>
        <Button @click="testInfo" variant="secondary">Test Info Toast</Button>
        <Button @click="testWarn" variant="outline">Test Warning Toast</Button>
        <Button @click="testError" variant="destructive"
          >Test Error Toast</Button
        >
      </div>
    </Container>
  </section>
</template>

<script setup lang="ts">
// TODO
import { toast } from "vue-sonner";

const testSuccess = () => {
  toast.success("Sighting submitted ✅", {
    description: `Your sighting has been submitted successfully! Reference ID:...`,
  });
};

const testInfo = () => {
  toast.info("New features available 📋", {
    description: "Check out the new wildlife identification guide!",
  });
};

const testWarn = () => {
  toast.warning("Location accuracy notice ⚠️", {
    description: "GPS signal is weak. Consider moving to an open area.",
  });
};

const testError = () => {
  toast.error("Submission failed ❌", {
    description:
      "Unable to save sighting. Please check your connection and try again.",
  });
};
</script>
