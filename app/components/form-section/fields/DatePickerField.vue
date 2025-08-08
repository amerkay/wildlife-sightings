<script setup lang="ts">
import { ref, computed } from "vue";
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
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface Props {
  modelValue?: string;
  placeholder?: string;
  buttonClass?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Pick a date",
  buttonClass: "w-[280px]",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// Date formatter
const dfLong = new DateFormatter("en-US", { dateStyle: "long" });

const parsedValue = computed(() => {
  if (!props.modelValue) return undefined;
  try {
    return parseDate(props.modelValue);
  } catch {
    return undefined;
  }
});

const displayValue = computed(() => {
  if (!parsedValue.value) return props.placeholder;
  return dfLong.format(parsedValue.value.toDate(getLocalTimeZone()));
});

function handleDateChange(date: DateValue | undefined) {
  emit("update:modelValue", date ? date.toString() : "");
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
            !modelValue && 'text-muted-foreground',
            buttonClass
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span>{{ displayValue }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        :model-value="parsedValue"
        initial-focus
        @update:model-value="handleDateChange"
      />
    </PopoverContent>
  </Popover>
</template>
