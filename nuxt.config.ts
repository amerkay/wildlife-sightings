// https://nuxt.com/docs/api/configuration/nuxt-config

// @ts-nocheck
import veauryVitePlugins from "veaury/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },

  modules: ["shadcn-nuxt", "@nuxtjs/color-mode"],

  css: ["@/assets/css/tailwind.css"],
  components: [
    { path: "~/components", pathPrefix: false },
    // { path: "~/components/block", pathPrefix: false, priority: 2 },
    // { path: "~/components/shared", pathPrefix: false },
    { path: "~/components/base", pathPrefix: false },
    // { path: "~/components/forms", pathPrefix: false },
    {
      path: "~/components/ui",
      extensions: [".vue"],
      pathPrefix: false,
      priority: 1,
    },
  ],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./app/components/ui",
  },
  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
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

      tailwindcss(),
    ],
  },
});
