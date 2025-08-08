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
import { Button } from "@/components/ui/button";

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <!-- Date -->
    <FormField name="live.date" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel>Date of Sighting</FormLabel>
        <FormControl>
          <div class="flex gap-2">
            <Input type="date" v-bind="field" class="max-w-[260px]" />
            <Button
              type="button"
              variant="secondary"
              @click="() => field.onChange(todayStr())"
              >Today</Button
            >
            <Button
              type="button"
              variant="secondary"
              @click="() => field.onChange(yesterdayStr())"
              >Yesterday</Button
            >
          </div>
        </FormControl>
        <p v-if="errorMessage" class="text-sm text-destructive mt-1">
          {{ errorMessage }}
        </p>
      </FormItem>
    </FormField>

    <!-- Frequency -->
    <FormField name="live.frequency" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>How often have you seen an owl here?</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-[320px]">
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
            <SelectTrigger class="w-[320px]">
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

    <FormField name="live.observationPeriod" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Observation Period (optional)</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., May 2024 to August 2025"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </section>
</template>
