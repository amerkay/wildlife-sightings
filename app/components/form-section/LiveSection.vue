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
// Added date related imports
import { ref, onMounted, type Ref } from "vue";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  type DateValue,
  // CalendarDate (only if needed later)
} from "@internationalized/date";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RangeCalendar } from "@/components/ui/range-calendar";
import type { DateRange } from "reka-ui";

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

// Date formatters
const dfLong = new DateFormatter("en-US", { dateStyle: "long" });
const dfMedium = new DateFormatter("en-US", { dateStyle: "medium" });

// Observation period range (kept as a single stored string: "YYYY-MM-DD to YYYY-MM-DD")
// Explicitly type start/end as DateValue | undefined to satisfy DateRange expectations
const obsRange = ref({
  start: undefined as DateValue | undefined,
  end: undefined as DateValue | undefined,
}) as Ref<DateRange>;

onMounted(() => {
  // Parse existing stored observation period if present (expects "start to end")
  const raw: unknown = (values as any)?.live?.observationPeriod;
  if (typeof raw === "string" && raw.includes(" to ")) {
    const [s, e] = raw.split(" to ");
    try {
      if (s) obsRange.value.start = parseDate(s);
    } catch {}
    try {
      if (e) obsRange.value.end = parseDate(e);
    } catch {}
  } else if (typeof raw === "string" && raw) {
    // single date stored previously
    try {
      obsRange.value.start = parseDate(raw);
    } catch {}
  }
});
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Observation Details</h2>

    <!-- Date Picker -->
    <FormField name="live.date" v-slot="{ field, errorMessage }">
      <FormItem class="flex flex-col">
        <FormLabel>Date of Sighting</FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-[280px] justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )
                "
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <span>
                  {{
                    field.value
                      ? dfLong.format(
                          parseDate(field.value).toDate(getLocalTimeZone())
                        )
                      : "Pick a date"
                  }}
                </span>
              </Button>
              <input hidden />
            </FormControl>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar
              :model-value="field.value ? parseDate(field.value) : undefined"
              initial-focus
              @update:model-value="(v) => field.onChange(v ? v.toString() : '')"
            />
          </PopoverContent>
        </Popover>
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

    <!-- Observation Period Range Picker -->
    <FormField name="live.observationPeriod" v-slot="{ field }">
      <FormItem class="flex flex-col">
        <FormLabel>Observation Period (optional)</FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-[320px] justify-start text-left font-normal',
                    !obsRange.start && 'text-muted-foreground'
                  )
                "
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <template v-if="obsRange.start">
                  <template v-if="obsRange.end">
                    {{
                      dfMedium.format(obsRange.start.toDate(getLocalTimeZone()))
                    }}
                    -
                    {{
                      dfMedium.format(obsRange.end.toDate(getLocalTimeZone()))
                    }}
                  </template>
                  <template v-else>
                    {{
                      dfMedium.format(obsRange.start.toDate(getLocalTimeZone()))
                    }}
                  </template>
                </template>
                <template v-else> Pick date range </template>
              </Button>
              <input hidden />
            </FormControl>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <RangeCalendar
              v-model="obsRange"
              initial-focus
              :number-of-months="2"
              @update:model-value="
                (v) => {
                  const start = v.start ? v.start.toString() : '';
                  const end = v.end ? v.end.toString() : '';
                  field.onChange(
                    start && end ? `${start} to ${end}` : start || ''
                  );
                }
              "
              @update:start-value="
                (s) => {
                  obsRange.start = s;
                }
              "
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    </FormField>
  </section>
</template>
