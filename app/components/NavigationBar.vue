<script setup lang="ts">
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";

interface NavigationItem {
  id: string;
  title: string;
  url?: string;
  page?: { permalink: string };
  children?: NavigationItem[];
}

interface Navigation {
  items: NavigationItem[];
}

export interface Globals {
  title: string;
  description: string;
  logo: object;
  logo_dark_mode: object;
  favicon: string;
}

const props = defineProps<{
  navigation: Navigation;
  globals: Globals;
}>();

const colorMode = useColorMode();
const isDark = computed(
  () =>
    colorMode.preference === "dark" ||
    (colorMode.preference === "system" && colorMode.value === "dark")
);

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const signOut = async () => {
  await supabase.auth.signOut();
  await navigateTo("/");
};
</script>

<template>
  <Disclosure
    as="header"
    class="dark sticky top-0 z-50 w-full bg-background text-foreground"
    v-slot="{ open, close }"
  >
    <Container class="py-0">
      <div class="relative flex h-20 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <DisclosureButton
            class="relative inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary focus:outline-none focus:ring-inset"
          >
            <span class="absolute -inset-0.5" />
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block size-6" aria-hidden="true" />
            <XMarkIcon v-else class="block size-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
        <div
          class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start"
        >
          <NuxtLink to="/" class="flex shrink-0 items-center" @click="close">
            <img src="/logo.png" alt="Logo" class="h-16 w-auto" />
            <!-- <DirectusImage
							v-if="
								(globals.logo_dark_mode.id && isDark) ||
								['dark', 'accent-high-contrast'].includes(globals.nav_main_background)
							"
							:uuid="globals.logo_dark_mode.id"
							:width="globals.logo_dark_mode.width"
							:height="globals.logo_dark_mode.height"
							alt="globals.logo_dark_mode.description || 'Logo Dark'"
							class="max-h-12 w-auto max-w-32"
							fit="contain"
							loading="eager"
							sizes="60px"
						/>
						<DirectusImage
							v-else
							:uuid="globals.logo.id"
							:width="globals.logo.width"
							:height="globals.logo.height"
							:alt="globals.logo.description || 'Logo'"
							class="max-h-12 w-auto max-w-32"
							fit="contain"
							loading="eager"
							sizes="60px"
						/> -->
          </NuxtLink>
        </div>
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
        >
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="flex space-x-1">
              <template
                v-for="section in props.navigation.items"
                :key="section.id"
              >
                <Menu v-if="section.children?.length" as="div" class="relative">
                  <div>
                    <MenuButton
                      class="inline-flex items-center justify-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
                    >
                      <span>{{ section.title }}</span>
                      <ChevronDownIcon
                        class="-mr-1 ml-1 size-4 text-current/70"
                        aria-hidden="true"
                      />
                    </MenuButton>
                  </div>
                  <transition
                    enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95"
                    enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75"
                    leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95"
                  >
                    <MenuItems
                      class="absolute right-0 z-10 mt-2 min-w-[200px] origin-top-right rounded-md bg-card py-1 text-card-foreground shadow-lg ring-1 ring-black/5 focus:outline-none"
                    >
                      <MenuItem
                        v-for="child in section.children"
                        :key="child.id"
                        v-slot="{ active, close }"
                      >
                        <NuxtLink
                          :to="child.page?.permalink || child.url || '#'"
                          :class="[
                            active
                              ? 'bg-accent text-accent-foreground'
                              : 'text-card-foreground',
                            'block px-4 py-2 text-base',
                          ]"
                          @click.capture="close"
                        >
                          {{ child.title }}
                        </NuxtLink>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Menu>

                <NuxtLink
                  v-else
                  :to="section.page?.permalink || section.url || '#'"
                  custom
                  v-slot="{ isActive, href, navigate }"
                >
                  <a
                    :href="href"
                    @click="navigate"
                    :class="[
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      'rounded-md px-3 py-2 text-base font-medium',
                    ]"
                    :aria-current="isActive ? 'page' : undefined"
                  >
                    {{ section.title }}
                  </a>
                </NuxtLink>
              </template>

              <!-- Authentication Navigation -->
              <template v-if="!user">
                <NuxtLink
                  to="/auth/login"
                  custom
                  v-slot="{ isActive, href, navigate }"
                >
                  <a
                    :href="href"
                    @click="navigate"
                    :class="[
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      'rounded-md px-3 py-2 text-base font-medium',
                    ]"
                    :aria-current="isActive ? 'page' : undefined"
                  >
                    Login
                  </a>
                </NuxtLink>
                <NuxtLink
                  to="/auth/signup"
                  custom
                  v-slot="{ isActive, href, navigate }"
                >
                  <a
                    :href="href"
                    @click="navigate"
                    :class="[
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90',
                      'rounded-md px-3 py-2 text-base font-medium',
                    ]"
                    :aria-current="isActive ? 'page' : undefined"
                  >
                    Sign Up
                  </a>
                </NuxtLink>
              </template>

              <!-- User Menu when logged in -->
              <Menu v-else as="div" class="relative">
                <div>
                  <MenuButton
                    class="inline-flex items-center justify-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
                  >
                    <UserIcon class="size-5 mr-1" aria-hidden="true" />
                    <span>Account</span>
                    <ChevronDownIcon
                      class="-mr-1 ml-1 size-4 text-current/70"
                      aria-hidden="true"
                    />
                  </MenuButton>
                </div>
                <transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems
                    class="absolute right-0 z-10 mt-2 min-w-[200px] origin-top-right rounded-md bg-card py-1 text-card-foreground shadow-lg ring-1 ring-black/5 focus:outline-none"
                  >
                    <MenuItem v-slot="{ active, close }">
                      <NuxtLink
                        to="/my/sightings/"
                        :class="[
                          active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-card-foreground',
                          'block px-4 py-2 text-base',
                        ]"
                        @click.capture="close"
                      >
                        Dashboard
                      </NuxtLink>
                    </MenuItem>
                    <MenuItem v-slot="{ active, close }">
                      <button
                        @click="
                          signOut();
                          close();
                        "
                        :class="[
                          active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-card-foreground',
                          'block w-full text-left px-4 py-2 text-base',
                        ]"
                      >
                        Sign Out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </transition>
              </Menu>
            </div>
          </div>

          <ThemeToggle class="ml-3" />
        </div>
      </div>
    </Container>

    <DisclosurePanel class="border-t border-border sm:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3">
        <template v-for="section in props.navigation.items" :key="section.id">
          <div v-if="section.children?.length" class="space-y-1">
            <Disclosure v-slot="{ open: childOpen }">
              <DisclosureButton
                class="flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <span>{{ section.title }}</span>
                <ChevronDownIcon
                  :class="[
                    childOpen ? 'rotate-180 transform' : '',
                    'size-5 text-foreground/70',
                  ]"
                />
              </DisclosureButton>
              <DisclosurePanel class="ml-4 space-y-1 pt-1 pb-2">
                <NuxtLink
                  v-for="child in section.children"
                  :key="child.id"
                  :to="child.page?.permalink || child.url || '#'"
                  custom
                  v-slot="{ isActive, href, navigate }"
                  @click="close"
                >
                  <DisclosureButton
                    as="a"
                    :href="href"
                    @click="navigate"
                    :class="[
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      'block rounded-md py-2 pr-3 pl-3 text-base font-medium',
                    ]"
                    :aria-current="isActive ? 'page' : undefined"
                  >
                    {{ child.title }}
                  </DisclosureButton>
                </NuxtLink>
              </DisclosurePanel>
            </Disclosure>
          </div>
          <NuxtLink
            v-else
            :to="section.page?.permalink || section.url || '#'"
            custom
            v-slot="{ isActive, href, navigate }"
          >
            <DisclosureButton
              as="a"
              :href="href"
              @click="navigate"
              :class="[
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                'block rounded-md px-3 py-2 text-base font-medium',
              ]"
              :aria-current="isActive ? 'page' : undefined"
            >
              {{ section.title }}
            </DisclosureButton>
          </NuxtLink>
        </template>

        <!-- Mobile Authentication Navigation -->
        <template v-if="!user">
          <NuxtLink
            to="/auth/login"
            custom
            v-slot="{ isActive, href, navigate }"
          >
            <DisclosureButton
              as="a"
              :href="href"
              @click="navigate"
              :class="[
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                'block rounded-md px-3 py-2 text-base font-medium',
              ]"
              :aria-current="isActive ? 'page' : undefined"
            >
              Login
            </DisclosureButton>
          </NuxtLink>
          <NuxtLink
            to="/auth/signup"
            custom
            v-slot="{ isActive, href, navigate }"
          >
            <DisclosureButton
              as="a"
              :href="href"
              @click="navigate"
              :class="[
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
                'block rounded-md px-3 py-2 text-base font-medium',
              ]"
              :aria-current="isActive ? 'page' : undefined"
            >
              Sign Up
            </DisclosureButton>
          </NuxtLink>
        </template>

        <!-- Mobile User Menu when logged in -->
        <template v-else>
          <NuxtLink
            to="/my/sightings/"
            custom
            v-slot="{ isActive, href, navigate }"
          >
            <DisclosureButton
              as="a"
              :href="href"
              @click="navigate"
              :class="[
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                'block rounded-md px-3 py-2 text-base font-medium',
              ]"
              :aria-current="isActive ? 'page' : undefined"
            >
              Dashboard
            </DisclosureButton>
          </NuxtLink>
          <DisclosureButton
            as="button"
            @click="
              signOut();
              close();
            "
            class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Sign Out
          </DisclosureButton>
        </template>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
