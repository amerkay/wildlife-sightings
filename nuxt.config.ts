// https://nuxt.com/docs/api/configuration/nuxt-config

// @ts-nocheck
import veauryVitePlugins from "veaury/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,

  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL,
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },

  modules: [
    "shadcn-nuxt",
    "@nuxtjs/color-mode",
    // docs @ https://supabase.nuxtjs.org/getting-started/introduction
    "@nuxtjs/supabase",
    "@nuxt/fonts",
    // docs @ https://github.com/nuxt-modules/turnstile/
    "@nuxtjs/turnstile",
    "@nuxt/icon",
  ],

  // docs @ https://supabase.nuxtjs.org/getting-started/introduction
  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/confirm",
      include: ["/my/*", "/admin/*"],
      exclude: ["/my/sightings/new", "/my/sightings/new/"],
      saveRedirectToCookie: true,
    },
  },

  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY,
  },

  css: ["@/assets/css/tailwind.css"],
  components: [
    { path: "~/components", pathPrefix: false },
    { path: "~/components/block", pathPrefix: false, priority: 2 },
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

  nitro: {
    // lets Nuxt emit the correct structure for GitHub  Pages
    preset: "github_pages",
  },

  routeRules: {
    // TODO: Fix so the form is prerendered (github pages erros out)
    // "/my/sightings/new": { ssr: true, prerender: true },
    // "/my/sightings/new/": { ssr: true, prerender: true },
    "/my/**": { ssr: false, prerender: false },
    "/admin/**": { ssr: false, prerender: false },
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
