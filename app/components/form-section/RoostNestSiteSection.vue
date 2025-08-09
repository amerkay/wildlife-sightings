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
import { RadioCard } from "@/components/ui/radio-card";
import { SightingDateField, ObservationPeriodField } from "./fields";

const SITE_OBSERVED = [
  { key: "nest", label: "Nest (eggs or young seen)" },
  { key: "roost-regular", label: "Regular roost site (>10 pellets seen)" },
  {
    key: "roost-occasional",
    label: "Occasional roost site (<10 pellets seen)",
  },
  { key: "fly-in-out", label: "Owl flying into/out of the site" },
  { key: "carrying-food", label: "Owl carrying food to the site" },
  { key: "young-heard", label: "Young heard calling" },
] as const;

const SITE_TYPES = [
  { value: "traditional-farm", label: "Traditional farm building" },
  { value: "modern-farm", label: "Modern farm building (e.g., 'Dutch' barn)" },
  { value: "mixed-farm", label: "Mix of traditional and modern buildings" },
  { value: "tree-hole", label: "Tree hole / hollow" },
  { value: "other", label: "Other" },
] as const;

const NESTBOX_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
] as const;

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
      field-name="site.sightingDate"
      label="Date of sighting"
      required
    />

    <!-- Observations (wrapped in FormField to provide context for FormLabel) -->
    <FormField name="site.observed" v-slot>
      <FormItem>
        <FormLabel>What did you observe? (optional)</FormLabel>
        <FormControl>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              v-for="opt in SITE_OBSERVED"
              :key="opt.key"
              class="flex items-center gap-2 cursor-pointer"
              @click="toggleObserved(opt.key)"
            >
              <Checkbox
                :checked="values.site?.observed?.includes(opt.key)"
                @click.stop
              />
              <span class="text-sm leading-none font-medium select-none">{{
                opt.label
              }}</span>
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
            <SelectTrigger class="w-full sm:w-[360px]">
              <SelectValue placeholder="Select site type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in SITE_TYPES"
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
        <FormLabel>Is there a nestbox at the site? (optional)</FormLabel>
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
              <SelectItem value="owner">I am the owner</SelectItem>
              <SelectItem value="tenant">I am the tenant</SelectItem>
              <SelectItem value="watcher"
                >I 'just keep an eye on it'</SelectItem
              >
              <SelectItem value="other">Other</SelectItem>
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
