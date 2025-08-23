<script lang="ts">
import * as z from "zod";
import {
  LIVE_FREQ as LIVE_FREQ_CONST,
  LIVE_ACTIVITY as LIVE_ACTIVITY_CONST,
} from "./constants";

// Types from constants
type LiveFreq = (typeof LIVE_FREQ_CONST)[number]["value"];
type LiveActivity = (typeof LIVE_ACTIVITY_CONST)[number]["value"];

// Derive tuples for z.enum
const LIVE_FREQ_VALUES = LIVE_FREQ_CONST.map((o) => o.value) as [
  LiveFreq,
  ...LiveFreq[]
];
const LIVE_ACTIVITY_VALUES = LIVE_ACTIVITY_CONST.map((o) => o.value) as [
  LiveActivity,
  ...LiveActivity[]
];

export const liveSchema = z
  .object({
    frequency: z
      .enum(LIVE_FREQ_VALUES)
      .optional()
      .or(z.literal(""))
      .describe("How often you observed the barn owl"),
    activity: z
      .enum(LIVE_ACTIVITY_VALUES)
      .optional()
      .or(z.literal(""))
      .describe("What the barn owl was doing"),
    activityOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Activity description must be under 200 characters",
      })
      .describe("Description of other activity"),
    observationPeriod: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 30, {
        message: "Observation period must be under 30 characters",
      })
      .describe(
        "Time period of observation (e.g., May 2008 to Winter 2012/13)"
      ),
  })
  .refine(
    (v) =>
      v.activity !== "other" ||
      (v.activityOther && v.activityOther.trim().length > 0),
    { path: ["activityOther"], message: "Please describe the activity" }
  );
</script>

<script setup lang="ts">
import { useFormContext } from "vee-validate";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SightingDateField, ToggleableObservationPeriodField } from "./fields";
import { LIVE_FREQ, LIVE_ACTIVITY } from "./constants";

const { values } = useFormContext();
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <!-- Date Picker -->
    <SightingDateField
      field-name="sightingDate"
      label="Date of sighting"
      required
    />

    <!-- Observation Period -->
    <ToggleableObservationPeriodField
      field-name="live.observationPeriod"
      label="Observation Period"
      description="If you have noted Barn Owls in this location before, please enter the time period of your sightings (for example May 2008 to Winter 2012/13)"
      class="-mt-2"
    />

    <!-- Frequency -->
    <FormField name="live.frequency" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>How often have you seen an owl here? (optional)</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-full sm:w-[320px]">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in LIVE_FREQ"
                :key="opt.value"
                :value="opt.value"
                >{{ opt.label }}</SelectItem
              >
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Activity -->
    <FormField name="live.activity" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>What were you doing? (optional)</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-full sm:w-[320px]">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in LIVE_ACTIVITY"
                :key="opt.value"
                :value="opt.value"
                >{{ opt.label }}</SelectItem
              >
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField
      v-if="values.live?.activity === 'other'"
      name="live.activityOther"
      v-slot="{ componentField }"
    >
      <FormItem>
        <FormLabel>Describe your activity</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., Working in the garden"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </section>
</template>
