<template>
  <div class="relative w-full min-h-[90vh]">
    <ClientOnly>
      <KeplerMapVue
        :mapboxApiAccessToken="mapboxAccessToken"
        apiUrl="/api/observations"
        :isDarkMode="$colorMode.value === 'dark'"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { applyReactInVue } from "veaury";
import KeplerMap from "../../react_app/KeplerMap";

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

const KeplerMapVue = applyReactInVue(KeplerMap);
</script>
