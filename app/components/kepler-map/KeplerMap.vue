<template>
  <KeplerMapVue
    :mapboxApiAccessToken="mapboxApiAccessToken"
    :isDarkMode="isDarkMode"
    :onMapReady="onMapReady"
  />
</template>

<script lang="ts" setup>
import { applyReactInVue } from "veaury";
import KeplerMap from "../../../react_app/KeplerMap";

interface Props {
  mapboxApiAccessToken: string;
  isDarkMode: boolean;
  onMapReady: (addDataToMapFn: (payload: any) => void) => void;
}

defineProps<Props>();

const KeplerMapVue = applyReactInVue(KeplerMap);
</script>
