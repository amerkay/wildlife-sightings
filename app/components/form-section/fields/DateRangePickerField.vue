<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from "vue";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  type DateValue,
} from "@internationalized/date";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";
import { Button } from "@/components/ui/button";
import type { DateRange } from "reka-ui";

interface Props {
  modelValue?: string;
  placeholder?: string;
  buttonClass?: string;
  disabled?: boolean;
  numberOfMonths?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Pick date range",
  buttonClass: "w-[320px]",
  numberOfMonths: 2,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// Date formatters
const dfMedium = new DateFormatter("en-US", { dateStyle: "medium" });

// Range state (typed properly for DateRange)
const range = ref({
  start: undefined as DateValue | undefined,
  end: undefined as DateValue | undefined,
}) as Ref<DateRange>;

onMounted(() => {
  // Parse existing stored range if present (expects "start to end")
  if (props.modelValue && props.modelValue.includes(" to ")) {
    const [s, e] = props.modelValue.split(" to ");
    try {
      if (s) range.value.start = parseDate(s);
    } catch {}
    try {
      if (e) range.value.end = parseDate(e);
    } catch {}
  } else if (props.modelValue) {
    // single date stored previously
    try {
      range.value.start = parseDate(props.modelValue);
    } catch {}
  }
});

const displayValue = computed(() => {
  if (!range.value.start) return props.placeholder;

  if (range.value.end) {
    return `${dfMedium.format(
      range.value.start.toDate(getLocalTimeZone())
    )} - ${dfMedium.format(range.value.end.toDate(getLocalTimeZone()))}`;
  }

  return dfMedium.format(range.value.start.toDate(getLocalTimeZone()));
});

function handleRangeChange(value: DateRange) {
  range.value = value;
  const start = value.start ? value.start.toString() : "";
  const end = value.end ? value.end.toString() : "";
  emit("update:modelValue", start && end ? `${start} to ${end}` : start || "");
}

function handleStartValueChange(start: DateValue | undefined) {
  range.value.start = start;
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="
          cn(
            'justify-start text-left font-normal',
            !range.start && 'text-muted-foreground',
            buttonClass
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span>{{ displayValue }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <RangeCalendar
        v-model="range"
        initial-focus
        :number-of-months="numberOfMonths"
        @update:model-value="handleRangeChange"
        @update:start-value="handleStartValueChange"
      />
    </PopoverContent>
  </Popover>
</template>
