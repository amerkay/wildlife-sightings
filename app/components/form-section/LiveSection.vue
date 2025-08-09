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
import { SightingDateField, ObservationPeriodField } from "./fields";

const LIVE_FREQ = [
  { value: "once", label: "Just this once" },
  { value: "weekly", label: "More than once a week" },
  { value: "monthly", label: "More than once a month" },
  { value: "less-monthly", label: "Less than once a month" },
] as const;

const LIVE_ACTIVITY = [
  { value: "driving", label: "Driving" },
  { value: "walking", label: "Walking" },
  { value: "home", label: "At home" },
  { value: "other", label: "Other" },
] as const;

const { values } = useFormContext();
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <!-- Date Picker -->
    <SightingDateField
      field-name="live.sightingDate"
      label="Date of sighting"
      required
    />

    <!-- Frequency -->
    <FormField name="live.frequency" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>How often have you seen an owl here?</FormLabel>
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
        <FormLabel>What were you doing?</FormLabel>
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

    <!-- Observation Period Range Picker -->
    <ObservationPeriodField
      field-name-from="live.observationPeriodFrom"
      field-name-to="live.observationPeriodTo"
      label="Observation Period (optional)"
    />
  </section>
</template>
