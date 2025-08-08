<script setup lang="ts">
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationPicker from "@/components/LocationPicker.vue";

const props = withDefaults(
  defineProps<{
    /** Show reverse geocoding fields and enable reverse geocoding API calls. */
    showReverseGeoFields?: boolean;
  }>(),
  { showReverseGeoFields: true }
);
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-medium">Location of Sighting</h2>

    <!-- Uses your ready-made LocationPicker.vue -->
    <LocationPicker
      name="location"
      :show-reverse-geo-fields="showReverseGeoFields"
    />

    <FormField name="location.notes" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Location Notes</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., In the hollow oak tree"
            v-bind="componentField"
          />
        </FormControl>
        <FormDescription
          >Any helpful specifics about the location.</FormDescription
        >
        <FormMessage />
      </FormItem>
    </FormField>
  </section>
</template>
