<script lang="ts">
import * as z from "zod";
import { DEAD_CAUSE as DEAD_CAUSE_CONST } from "./constants";

// Derive tuple for z.enum from constants
export type DeadCause = (typeof DEAD_CAUSE_CONST)[number]["value"];
const DEAD_CAUSE_VALUES = DEAD_CAUSE_CONST.map((o) => o.value) as [
  DeadCause,
  ...DeadCause[]
];

export const deadSchema = z
  .object({
    sightingDate: z.coerce.date({ error: "Date found is required" }),
    cause: z.enum(DEAD_CAUSE_VALUES).optional().or(z.literal("")),
    causeOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Cause description must be under 200 characters",
      }),
    details: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 700, {
        message: "Details must be under 700 characters",
      }),
  })
  .refine(
    (v) =>
      v.cause !== "other" || (v.causeOther && v.causeOther.trim().length > 0),
    { path: ["causeOther"], message: "Please describe the cause" }
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
import { SightingDateField } from "./fields";
import { DEAD_CAUSE } from "./constants";

const { values } = useFormContext();
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <SightingDateField
      field-name="dead.sightingDate"
      label="Date Found"
      required
    />

    <FormField name="dead.cause" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Apparent Cause of Death (optional)</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-full sm:w-[420px]">
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
