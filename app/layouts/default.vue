<script setup lang="ts">
import { useHead } from "#app";
import { computed } from "vue";

const fallbackSiteData = {
  headerNavigation: {
    items: [
      {
        id: "home",
        title: "Home",
        url: "/",
      },
      {
        id: "sighting-new",
        title: "New Sighting",
        url: "/my/sightings/new",
      },
    ],
  },
  footerNavigation: {
    items: [
      {
        id: "home",
        title: "Home",
        url: "/",
      },
      {
        id: "test-keplergl",
        title: "Kepler.gl Test",
        url: "/test-keplergl",
      },
    ],
  },
  globals: {
    title: "Owl Sightings",
    description: "A platform for sharing and discovering owl sightings.",
    logo: {},
    logo_dark_mode: {},
    favicon: "",
  },
};

const finalSiteData = computed(() => fallbackSiteData);

const headerNavigation = computed(
  () => finalSiteData.value?.headerNavigation || { items: [] }
);
const footerNavigation = computed(
  () => finalSiteData.value?.footerNavigation || { items: [] }
);
const globals = computed(
  () => finalSiteData.value?.globals || fallbackSiteData.globals
);

const siteTitle = computed(() => globals.value?.title || "Unknown");
const siteDescription = computed(() => globals.value?.description || "");
const faviconURL = computed(
  () => "/favicon.ico"
  //   globals.value?.favicon
  //     ? `${directusUrl}/assets/${globals.value.favicon}?height=100`
  //     : "/favicon.ico"
);

useHead({
  titleTemplate: (pageTitle) =>
    pageTitle ? `${pageTitle} | ${siteTitle.value}` : siteTitle.value,
  meta: [
    { name: "description", content: siteDescription },
    { property: "og:title", content: siteTitle },
    { property: "og:description", content: siteDescription },
    { property: "og:type", content: "website" },
  ],
  link: [{ rel: "icon", type: "image/x-icon", href: faviconURL }],
});
</script>

<template>
  <div>
    <NavigationBar :navigation="headerNavigation" :globals="globals" />

    <NuxtPage class="min-h-[65vh]" />

    <Footer :navigation="footerNavigation" :globals="globals" />
  </div>
</template>
