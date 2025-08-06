<script setup lang="ts">
import { type Globals } from "./NavigationBar.vue";

export interface SocialLink {
  service: string;
  url: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  url?: string | null;
  page?: {
    permalink?: string | null;
  };
}

export interface FooterProps {
  navigation: {
    items: NavigationItem[];
  };
  globals: Globals;
}

const props = defineProps<FooterProps>();

const colorMode = useColorMode();
const isDark = computed(
  () =>
    colorMode.preference === "dark" ||
    (colorMode.preference === "system" && colorMode.value === "dark")
);
</script>

<template>
  <footer class="dark bg-background py-12">
    <Container class="py-0 text-foreground dark:text-white">
      <div class="flex flex-col items-start justify-between gap-8 md:flex-row">
        <div class="flex-1">
          <NuxtLink
            to="/"
            class="inline-block transition-opacity hover:opacity-70"
          >
            <img src="/logo.png" alt="Logo" class="h-24 w-auto" />

            <!-- <DirectusImage
              v-if="
                (globals.logo_dark_mode && isDark) ||
                ['dark', 'accent-high-contrast'].includes(
                  globals.nav_footer_background
                )
              "
              :uuid="globals.logo_dark_mode.id"
              :width="globals.logo_dark_mode.width"
              :height="globals.logo_dark_mode.height"
              :alt="globals.logo_dark_mode.description || 'Logo Dark'"
              class="max-h-20 w-auto max-w-72"
              sizes="100px"
            />
            <DirectusImage
              v-else="globals.logo"
              :uuid="globals.logo.id"
              :width="globals.logo.width"
              :height="globals.logo.height"
              :alt="globals.logo.description || 'Logo'"
              class="max-h-20 w-auto max-w-72"
              sizes="100px"
            /> -->
          </NuxtLink>

          <p
            v-if="props.globals.description"
            ref="description"
            class="text-description mt-2"
          >
            <span>
              {{ props.globals.description }}
            </span>
          </p>

          <!-- Social Links -->
          <!-- <div
            v-if="props.globals.social_links?.length"
            class="mt-4 flex space-x-4"
          >
            <a
              v-for="social in props.globals.social_links"
              :key="social.service"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex size-8 items-center justify-center rounded-sm bg-transparent transition-colors hover:opacity-70"
            >
              <img
                :src="`/icons/social/${social.service}.svg`"
                :alt="`${social.service} icon`"
                class="size-6 dark:invert accent-high-contrast:invert"
              />
            </a>
          </div> -->
        </div>

        <div class="flex flex-1 flex-col items-start md:items-end">
          <nav
            v-if="props.navigation.items?.length"
            class="w-full text-left md:w-auto"
          >
            <ul class="space-y-4">
              <li v-for="item in props.navigation.items" :key="item.id">
                <NuxtLink
                  v-if="item.page?.permalink"
                  :to="item.page.permalink"
                  class="text-nav font-medium hover:underline"
                >
                  {{ item.title }}
                </NuxtLink>
                <a
                  v-else
                  :href="item.url || '#'"
                  class="text-nav font-medium hover:underline"
                >
                  {{ item.title }}
                </a>
              </li>
            </ul>

            <!-- <ClientOnly> -->
            <ThemeToggle class="mt-4" />
            <!-- </ClientOnly> -->
          </nav>
        </div>
      </div>
    </Container>
  </footer>
</template>
