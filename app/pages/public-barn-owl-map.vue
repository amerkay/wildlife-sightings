<script setup lang="ts">
import { DATASET_ID as PUBLIC_SIGHTINGS_DATASET_ID } from "~/composables/dataset-loader/datasets/public-sightings";
</script>

<template>
  <FullPageMap :datasetIds="[PUBLIC_SIGHTINGS_DATASET_ID]" />
</template>
