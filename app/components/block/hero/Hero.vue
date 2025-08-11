<script lang="ts" setup>
import { ArrowRight } from "lucide-vue-next";
</script>

<template>
  <div class="relative w-full">
    <Container class="flex flex-col gap-y-5 md:flex-row md:gap-10 lg:h-[720px]">
      <div class="flex h-full items-center justify-center md:w-2/3 xl:w-1/2">
        <div class="text-center md:text-left">
          <Badge
            to="#"
            variant="outline"
            class="px-3 py-1.5 text-xs font-normal md:text-sm lg:py-2"
            >Help us protect Barn Owls <ArrowRight class="ml-3 h-4 w-4"
          /></Badge>
          <h1
            class="mb-4 mt-7 text-4xl font-bold md:text-5xl lg:mb-6 lg:mt-5 xl:text-6xl"
          >
            Report Barn Owl Sightings & Nest Sites
          </h1>
          <p class="text-lg text-muted-foreground lg:text-xl">
            Help us conserve Barn Owls by reporting nest sites, roost locations,
            and sightings across the UK. Your observations provide invaluable
            data for conservation efforts.
          </p>
          <div class="mt-8 grid grid-cols-1 gap-3 md:flex lg:mt-12">
            <NuxtLink to="/public-barn-owl-map">
              <Button size="lg" variant="outline">View Public Map</Button>
            </NuxtLink>
            <NuxtLink to="/my/sightings/new">
              <Button size="lg" class="min-w-56">Report a Sighting</Button>
            </NuxtLink>
          </div>
          <p class="mt-5 text-sm text-muted-foreground">
            Already registered?
            <NuxtLink to="/auth/login" class="font-bold">Log in</NuxtLink> to
            quickly submit reports and view your contributions.
          </p>
        </div>
      </div>
    </Container>

    <div
      class="md:absolute md:top-0 md:right-0 h-[350px] md:h-full md:w-1/3 xl:w-1/2"
    >
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <img
        class="h-full w-full object-cover lg:[clip-path:polygon(15%_0,100%_0,100%_100%,0_100%)]"
        :src="'/imgs/map-heatmap-screenshot-dark.png'"
        alt="Heat Map showing Barn Owl sightings"
        loading="eager"
        width="1491"
        height="1785"
        :title="`BOT hero section two header`"
      />
    </div>
  </div>
</template>
