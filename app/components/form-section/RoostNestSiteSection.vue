<script lang="ts">
import * as z from "zod";
import {
  SITE_OBSERVED as SITE_OBSERVED_CONST,
  SITE_TYPES as SITE_TYPES_CONST,
  NESTBOX_OPTIONS as NESTBOX_OPTIONS_CONST,
  CONNECTION_OPTIONS as CONNECTION_OPTIONS_CONST,
} from "./constants";

// Derive tuples for z.enum from constants
export type SiteObserved = (typeof SITE_OBSERVED_CONST)[number]["key"];
const SITE_OBSERVED_VALUES = SITE_OBSERVED_CONST.map((o) => o.key) as [
  SiteObserved,
  ...SiteObserved[]
];

export type SiteType = (typeof SITE_TYPES_CONST)[number]["value"];
const SITE_TYPE_VALUES = SITE_TYPES_CONST.map((o) => o.value) as [
  SiteType,
  ...SiteType[]
];

export type NestboxOpt = (typeof NESTBOX_OPTIONS_CONST)[number]["value"];
const NESTBOX_VALUES = NESTBOX_OPTIONS_CONST.map((o) => o.value) as [
  NestboxOpt,
  ...NestboxOpt[]
];

export type ConnectionOpt = (typeof CONNECTION_OPTIONS_CONST)[number]["value"];
const CONNECTION_VALUES = CONNECTION_OPTIONS_CONST.map((o) => o.value) as [
  ConnectionOpt,
  ...ConnectionOpt[]
];

export const siteSchema = z
  .object({
    observed: z
      .array(z.enum(SITE_OBSERVED_VALUES))
      .optional()
      .default([])
      .describe("What you observed at this site"),
    siteType: z
      .enum(SITE_TYPE_VALUES)
      .optional()
      .or(z.literal(""))
      .describe("Type of roost or nest site"),
    siteTypeOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Site description must be under 200 characters",
      })
      .describe("Description of other site type"),
    nestbox: z.enum(NESTBOX_VALUES).describe("Whether this involves a nestbox"),
    connection: z
      .enum(CONNECTION_VALUES)
      .optional()
      .or(z.literal(""))
      .describe("Connection to building or structure"),
    connectionOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Connection description must be under 200 characters",
      })
      .describe("Description of other connection type"),
    observationPeriodFrom: z
      .union([
        z.coerce.date().max(new Date(), "Date cannot be in the future"),
        z.literal(""),
      ])
      .optional()
      .describe("Start date of observation period"),
    observationPeriodTo: z
      .union([
        z.coerce.date().max(new Date(), "Date cannot be in the future"),
        z.literal(""),
      ])
      .optional()
      .describe("End date of observation period"),
  })
  .refine(
    (v) =>
      v.siteType !== "other" ||
      (v.siteTypeOther && v.siteTypeOther.trim().length > 0),
    { path: ["siteTypeOther"], message: "Please describe the site" }
  )
  .refine(
    (v) =>
      v.connection !== "other" ||
      (v.connectionOther && v.connectionOther.trim().length > 0),
    { path: ["connectionOther"], message: "Please describe your connection" }
  )
  .refine((v) => v.observed.length > 0, {
    path: ["observed"],
    message: "Please select at least one observed item",
  });
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioCard } from "~/components/radio-card";
import { SightingDateField, ObservationPeriodField } from "./fields";
import {
  SITE_OBSERVED,
  SITE_TYPES,
  NESTBOX_OPTIONS,
  CONNECTION_OPTIONS,
} from "./constants";

const { values, setFieldValue } = useFormContext();

function toggleObserved(v: string) {
  const arr = Array.isArray(values.site?.observed)
    ? [...values.site!.observed]
    : [];
  const i = arr.indexOf(v);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(v);
  setFieldValue("site.observed", arr);
}
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <!-- Last Roosted/Nested date -->
    <SightingDateField
      field-name="sightingDate"
      label="Date of sighting"
      required
    />

    <!-- Observations (wrapped in FormField to provide context for FormLabel) -->
    <FormField name="site.observed" v-slot>
      <FormItem>
        <FormLabel
          >What did you observe? <span class="text-red-500">*</span></FormLabel
        >
        <FormControl>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              v-for="opt in SITE_OBSERVED"
              :key="opt.key"
              class="inline-flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
              @click="toggleObserved(opt.key)"
            >
              <Checkbox
                :checked="values.site?.observed?.includes(opt.key)"
                @click.stop
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Site type -->
    <FormField name="site.siteType" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>What is the site like? (optional)</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-full sm:w-[420px]">
              <SelectValue placeholder="Select site type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in SITE_TYPES"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField
      v-if="values.site?.siteType === 'other'"
      name="site.siteTypeOther"
      v-slot="{ componentField }"
    >
      <FormItem>
        <FormLabel>Describe the site</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., Old quarry building"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Nestbox -->
    <FormField name="site.nestbox" v-slot="{ componentField }">
      <FormItem>
        <FormLabel
          >Is there a nestbox at the site?
          <span class="text-red-500">*</span></FormLabel
        >
        <FormControl>
          <RadioGroup v-bind="componentField" class="flex gap-4">
            <RadioCard
              v-for="opt in NESTBOX_OPTIONS"
              :key="opt.value"
              :value="opt.value"
              :selected="componentField.modelValue"
              :label="opt.label"
              class="flex-1"
            />
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Connection -->
    <FormField name="site.connection" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Your connection to the property (optional)</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-full sm:w-[360px]">
              <SelectValue placeholder="Select your connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in CONNECTION_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField
      v-if="values.site?.connection === 'other'"
      name="site.connectionOther"
      v-slot="{ componentField }"
    >
      <FormItem>
        <FormLabel>Describe your connection</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., Work on the farm occasionally"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Observation period -->
    <ObservationPeriodField
      field-name-from="site.observationPeriodFrom"
      field-name-to="site.observationPeriodTo"
      label="Observation Period (optional)"
      description="If you have observed this roost or nest site for some time please enter the approx. time period of observation"
    />
  </section>
</template>
