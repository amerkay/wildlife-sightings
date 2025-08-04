// https://nuxt.com/docs/api/configuration/nuxt-config

// @ts-nocheck
import veauryVitePlugins from "veaury/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },

  // add vite plugins for Veaury
  vite: {
    plugins: [
      // Example usage @ https://github.com/devilwjp/veaury_in_nuxtjs
      // @ts-ignore
      veauryVitePlugins({
        type: "vue",
        isNuxt: true,
      }),
    ],
  },
});
