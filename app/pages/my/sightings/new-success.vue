<!-- TODO -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { CheckCircle2 } from "lucide-vue-next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Container from "@/components/base/Container.vue";

const route = useRoute();
const type = computed(() => (route.query.type as string) || "");
const isSite = computed(() => type.value === "site");
</script>

<template>
  <Container :is-full-width="false" width="sm" class="py-12">
    <div class="flex flex-col items-center text-center space-y-8">
      <div class="flex flex-col items-center space-y-4">
        <Icon
          name="lucide:check-circle"
          class="text-green-500"
          size="64"
          aria-hidden="true"
        />
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight">
            Thank you for your submission
          </h1>
          <p class="text-muted-foreground max-w-prose mx-auto">
            Your barn owl sighting has been received successfully.
          </p>
        </div>
      </div>

      <!-- Alerts moved directly under success text -->
      <div class="space-y-5 w-full text-left">
        <Alert v-if="isSite">
          <Icon name="lucide:info" size="20" mode="svg" />
          <AlertTitle>Nest site information</AlertTitle>
          <AlertDescription>
            <div>
              If you have a nest site and are interested in having your Barn Owl
              chicks monitored/ringed, please email us on
              <a
                href="mailto:info@barnowltrust.org.uk"
                class="underline font-medium"
                >info@barnowltrust.org.uk</a
              >
              as we may be able to put you in touch with a local licenced
              ringer.
            </div>
          </AlertDescription>
        </Alert>

        <Alert variant="default">
          <Icon name="lucide:alert-circle" size="20" mode="svg" />
          <AlertTitle>Please note</AlertTitle>
          <AlertDescription>
            <div>
              We do not regularly check through the entries, therefore if you
              are writing about an issue regarding planning permission or
              another urgent situation (or anything that you would like a
              response to), please contact us on
              <a
                href="mailto:info@barnowltrust.org.uk"
                class="underline font-medium"
                >info@barnowltrust.org.uk</a
              >
              or
              <a href="tel:01364255256" class="underline font-medium"
                >01364 255 256</a
              >. Thank you.
            </div>
          </AlertDescription>
        </Alert>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:justify-start pt-2">
          <NuxtLink to="/my/sightings/new" class="w-full sm:w-auto">
            <Button variant="outline" class="w-full sm:w-auto"
              >Report another</Button
            >
          </NuxtLink>
          <NuxtLink to="/my/sightings" class="w-full sm:w-auto">
            <Button class="w-full sm:w-auto">View my sightings</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </Container>
</template>
