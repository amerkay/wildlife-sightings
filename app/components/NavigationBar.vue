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
  action?: string;
  variant?: string;
  children?: NavigationItem[];
  type?: "nav" | "auth" | "user" | "admin";
  isDropdown?: boolean;
  icon?: any;
}

interface Navigation {
  items: NavigationItem[];
}

interface AuthNavigation {
  login: NavigationItem;
  signup: NavigationItem;
}

interface UserNavigation {
  items: NavigationItem[];
}

interface AdminNavigation {
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
  authNavigation?: AuthNavigation;
  userNavigation?: UserNavigation;
  adminNavigation?: AdminNavigation;
  userRole?: string;
}>();

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const signOut = async () => {
  await supabase.auth.signOut();
  await navigateTo("/");
};

const handleAction = async (action: string) => {
  if (action === "signOut") {
    await signOut();
  }
};

// Unified menu structure
const allMenuItems = computed(() => {
  const items: NavigationItem[] = [];

  // Add main navigation
  items.push(
    ...props.navigation.items.map((item) => ({ ...item, type: "nav" as const }))
  );

  // Add auth navigation when not logged in
  if (!user.value && props.authNavigation) {
    items.push(
      { ...props.authNavigation.login, type: "auth" as const },
      { ...props.authNavigation.signup, type: "auth" as const }
    );
  }

  // Add admin menu when user is admin
  if (user.value && props.userRole === "admin" && props.adminNavigation) {
    items.push({
      id: "admin-menu",
      title: "Admin",
      type: "admin" as const,
      isDropdown: true,
      children: props.adminNavigation.items,
    });
  }

  // Add user menu when logged in
  if (user.value && props.userNavigation) {
    items.push({
      id: "user-menu",
      title: "Account",
      type: "user" as const,
      isDropdown: true,
      icon: UserIcon,
      children: props.userNavigation.items,
    });
  }

  return items;
});

// Common styles
const getItemClasses = (
  isActive: boolean,
  variant?: string,
  isMobile = false
) => {
  const base = isMobile
    ? "block rounded-md px-3 py-2 text-base font-medium"
    : "rounded-md px-3 py-2 text-base font-medium";

  if (variant === "primary") {
    return [
      isActive
        ? "bg-primary text-primary-foreground"
        : "bg-primary text-primary-foreground hover:bg-primary/90",
      base,
    ];
  }

  return [
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-foreground hover:bg-accent hover:text-accent-foreground",
    base,
  ];
};

const getDropdownClasses = (active: boolean) => [
  active ? "bg-accent text-accent-foreground" : "text-card-foreground",
  "block px-4 py-2 text-base",
];
</script>

<template>
  <Disclosure
    as="header"
    class="dark top-0 z-50 w-full bg-background text-foreground"
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
          </NuxtLink>
        </div>
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
        >
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="flex space-x-1">
              <template v-for="item in allMenuItems" :key="item.id">
                <!-- Dropdown menus -->
                <Menu
                  v-if="item.children?.length || item.isDropdown"
                  as="div"
                  class="relative"
                >
                  <div>
                    <MenuButton
                      class="inline-flex items-center justify-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
                    >
                      <component
                        v-if="item.icon"
                        :is="item.icon"
                        class="size-5 mr-1"
                        aria-hidden="true"
                      />
                      <span>{{ item.title }}</span>
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
                        v-for="child in item.children"
                        :key="child.id"
                        v-slot="{ active, close }"
                      >
                        <NuxtLink
                          v-if="child.url"
                          :to="child.url"
                          :class="getDropdownClasses(active)"
                          @click.capture="close"
                        >
                          {{ child.title }}
                        </NuxtLink>
                        <button
                          v-else-if="child.action"
                          @click="
                            handleAction(child.action);
                            close();
                          "
                          :class="[
                            ...getDropdownClasses(active),
                            'w-full text-left',
                          ]"
                        >
                          {{ child.title }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Menu>

                <!-- Regular navigation items -->
                <NuxtLink
                  v-else
                  :to="item.url || '#'"
                  custom
                  v-slot="{ isActive, href, navigate }"
                >
                  <a
                    :href="href"
                    @click="navigate"
                    :class="getItemClasses(isActive, item.variant)"
                    :aria-current="isActive ? 'page' : undefined"
                  >
                    {{ item.title }}
                  </a>
                </NuxtLink>
              </template>
            </div>
          </div>

          <ThemeToggle class="ml-3" />
        </div>
      </div>
    </Container>

    <DisclosurePanel class="border-t border-border sm:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3">
        <template v-for="item in allMenuItems" :key="item.id">
          <!-- Mobile dropdown menus -->
          <div v-if="item.children?.length" class="space-y-1">
            <Disclosure v-slot="{ open: childOpen }">
              <DisclosureButton
                class="flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <span>{{ item.title }}</span>
                <ChevronDownIcon
                  :class="[
                    childOpen ? 'rotate-180 transform' : '',
                    'size-5 text-foreground/70',
                  ]"
                />
              </DisclosureButton>
              <DisclosurePanel class="ml-4 space-y-1 pt-1 pb-2">
                <template v-for="child in item.children" :key="child.id">
                  <NuxtLink
                    v-if="child.url"
                    :to="child.url"
                    custom
                    v-slot="{ isActive, href, navigate }"
                    @click="close"
                  >
                    <DisclosureButton
                      as="a"
                      :href="href"
                      @click="navigate"
                      :class="getItemClasses(isActive, child.variant, true)"
                      :aria-current="isActive ? 'page' : undefined"
                    >
                      {{ child.title }}
                    </DisclosureButton>
                  </NuxtLink>
                  <DisclosureButton
                    v-else-if="child.action"
                    as="button"
                    @click="
                      handleAction(child.action);
                      close();
                    "
                    class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {{ child.title }}
                  </DisclosureButton>
                </template>
              </DisclosurePanel>
            </Disclosure>
          </div>

          <!-- Mobile regular items -->
          <template v-else>
            <NuxtLink
              v-if="item.url"
              :to="item.url"
              custom
              v-slot="{ isActive, href, navigate }"
            >
              <DisclosureButton
                as="a"
                :href="href"
                @click="navigate"
                :class="getItemClasses(isActive, item.variant, true)"
                :aria-current="isActive ? 'page' : undefined"
              >
                {{ item.title }}
              </DisclosureButton>
            </NuxtLink>
            <DisclosureButton
              v-else-if="item.action"
              as="button"
              @click="
                handleAction(item.action);
                close();
              "
              class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {{ item.title }}
            </DisclosureButton>
          </template>
        </template>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>

<style scoped>
a[href]:hover {
  text-decoration: none;
}
</style>
