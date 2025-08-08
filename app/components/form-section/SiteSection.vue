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
import { Button } from "@/components/ui/button";

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

    <!-- Last use date -->
    <FormField name="site.lastUseDate" v-slot="{ field, errorMessage }">
      <FormItem>
        <FormLabel>Approximate Date of Last Use</FormLabel>
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

    <!-- Observations (wrapped in FormField to provide context for FormLabel) -->
    <FormField name="site.observed" v-slot>
      <FormItem>
        <FormLabel>What did you observe? <span class="text-destructive">*</span></FormLabel>
        <FormControl>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
              v-for="opt in SITE_OBSERVED"
              :key="opt.key"
              class="flex items-center gap-2"
            >
              <Checkbox
                :checked="values.site?.observed?.includes(opt.key)"
                @update:checked="toggleObserved(opt.key)"
                :id="`site-ob-${opt.key}`"
              />
              <FormLabel :for="`site-ob-${opt.key}`" class="cursor-pointer">{{
                opt.label
              }}</FormLabel>
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Site type -->
    <FormField name="site.siteType" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>What is the site like?</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-[360px]">
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
    <FormField name="site.nestbox" v-slot="slot">
      <FormItem>
        <FormLabel>Is there a nestbox at the site?</FormLabel>
        <FormControl>
          <div class="flex gap-6">
            <div
              class="flex items-center gap-2 cursor-pointer"
              role="button"
              tabindex="0"
              @click="slot.handleChange('yes')"
              @keydown.enter.prevent="slot.handleChange('yes')"
              @keydown.space.prevent="slot.handleChange('yes')"
            >
              <input class="sr-only" type="radio" id="nb-yes" />
              <span class="h-4 w-4 rounded-full border" aria-hidden="true" />
              <FormLabel for="nb-yes" class="cursor-pointer">Yes</FormLabel>
            </div>
            <div
              class="flex items-center gap-2 cursor-pointer"
              role="button"
              tabindex="0"
              @click="slot.handleChange('no')"
              @keydown.enter.prevent="slot.handleChange('no')"
              @keydown.space.prevent="slot.handleChange('no')"
            >
              <input class="sr-only" type="radio" id="nb-no" />
              <span class="h-4 w-4 rounded-full border" aria-hidden="true" />
              <FormLabel for="nb-no" class="cursor-pointer">No</FormLabel>
            </div>
            <div
              class="flex items-center gap-2 cursor-pointer"
              role="button"
              tabindex="0"
              @click="slot.handleChange('unknown')"
              @keydown.enter.prevent="slot.handleChange('unknown')"
              @keydown.space.prevent="slot.handleChange('unknown')"
            >
              <input class="sr-only" type="radio" id="nb-unk" />
              <span class="h-4 w-4 rounded-full border" aria-hidden="true" />
              <FormLabel for="nb-unk" class="cursor-pointer">Unknown</FormLabel>
            </div>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Connection -->
    <FormField name="site.connection" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Your connection to the property</FormLabel>
        <FormControl>
          <Select v-bind="componentField">
            <SelectTrigger class="w-[360px]">
              <SelectValue placeholder="Select your connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">I am the owner</SelectItem>
              <SelectItem value="tenant">I am the tenant</SelectItem>
              <SelectItem value="watcher">I just keep an eye on it</SelectItem>
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
    <FormField name="site.observationPeriod" v-slot="{ componentField }">
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
