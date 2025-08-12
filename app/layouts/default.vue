<script setup lang="ts">
import { useHead } from "#app";
import { computed } from "vue";

const siteData = {
  headerNavigation: {
    items: [
      {
        id: "sighting-new",
        title: "New Sighting",
        url: "/my/sightings/new",
      },
    ],
  },
  authNavigation: {
    login: {
      id: "auth-login",
      title: "Login",
      url: "/auth/login",
    },
    signup: {
      id: "auth-signup",
      title: "Sign Up",
      url: "/auth/signup",
      variant: "primary",
    },
  },
  userNavigation: {
    items: [
      {
        id: "my-sightings",
        title: "My Sightings",
        url: "/my/sightings/",
      },
      {
        id: "my-sightings-map",
        title: "My Sightings (map)",
        url: "/my/sightings/map",
      },
      {
        id: "sign-out",
        title: "Sign Out",
        action: "signOut",
      },
    ],
  },
  adminNavigation: {
    items: [
      {
        id: "admin-map-all",
        title: "Manage Sightings",
        url: "/admin/",
      },
      {
        id: "admin-map-all",
        title: "Map (All Sightings)",
        url: "/admin/map",
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
        id: "sighting-my",
        title: "My Sightings",
        url: "/my/sightings/",
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

const finalSiteData = computed(() => siteData);

// Get user role for admin navigation
const { data: userRole } = await useUserRole();

const headerNavigation = computed(() => {
  return finalSiteData.value?.headerNavigation || { items: [] };
});
const footerNavigation = computed(
  () => finalSiteData.value?.footerNavigation || { items: [] }
);
const globals = computed(
  () => finalSiteData.value?.globals || siteData.globals
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
    <NavigationBar
      :navigation="headerNavigation"
      :globals="globals"
      :auth-navigation="finalSiteData?.authNavigation"
      :user-navigation="finalSiteData?.userNavigation"
      :admin-navigation="finalSiteData?.adminNavigation"
      :user-role="userRole || undefined"
    />

    <NuxtPage class="min-h-[65vh]" />

    <Footer :navigation="footerNavigation" :globals="globals" />
  </div>
</template>
