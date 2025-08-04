<!-- pages/index.vue -->
<template>
  <div>
    <ClientOnly>
      <!-- Mount the React KeplerMap here -->
      <h1>Kepler Map</h1>
      <KeplerMapVue :mapboxApiAccessToken="mapboxAccessToken" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// import { applyPureReactInVue } from "veaury";
import { applyReactInVue } from "veaury";
import KeplerMap from "../../react_app/KeplerMap";

const {
  public: { mapboxAccessToken },
} = useRuntimeConfig();

// Wrap the React component for Vue
const KeplerMapVue = applyReactInVue(KeplerMap);
</script>
