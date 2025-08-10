<script lang="ts">
import * as z from "zod";
export const locationSchema = z.object({
  lat: z
    .number({ error: "Please select a location on the map" })
    .nullable()
    .refine((val) => val !== null, {
      message: "Please select a location on the map",
    }),
  lng: z
    .number({ error: "Please select a location on the map" })
    .nullable()
    .refine((val) => val !== null, {
      message: "Please select a location on the map",
    }),
  // placeName: z.string().min(1, "Place name / road number is required"),
  // county: z.string().optional().default(""),
  notes: z
    .string()
    .max(700, "Keep location notes under 700 chars")
    .optional()
    .or(z.literal("")),
});
</script>

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
      required
    />

    <FormField name="location.notes" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Location Notes (optional)</FormLabel>
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
