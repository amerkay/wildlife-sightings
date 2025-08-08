<script setup lang="ts">
import { useFormContext } from "vee-validate";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const DEAD_CAUSE = [
  { value: "road-minor", label: "Road Casualty - Minor Road" },
  { value: "road-major", label: "Road Casualty - Major Road (A/B road)" },
  {
    value: "road-motorway",
    label: "Road Casualty - Dual Carriageway / Motorway",
  },
  { value: "powerlines", label: "Near power lines / pylon" },
  { value: "railway", label: "Near railway line" },
  { value: "drowned", label: "Drowned (e.g., in water trough)" },
  { value: "unknown", label: "Cause not obvious / Unknown" },
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

    <FormField name="dead.dateFound" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel>Date Found</FormLabel>
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

    <FormField name="dead.cause" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Apparent Cause of Death</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-[420px]">
              <SelectValue placeholder="Select cause" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in DEAD_CAUSE"
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
      v-if="values.dead?.cause === 'other'"
      name="dead.causeOther"
      v-slot="{ componentField }"
    >
      <FormItem>
        <FormLabel>Describe the cause</FormLabel>
        <FormControl>
          <Input
            placeholder="e.g., Collided with window"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="dead.details" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Any additional details? (optional)</FormLabel>
        <FormControl>
          <Textarea
            placeholder="e.g., Bird was found at the base of a large oak tree..."
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </section>
</template>
