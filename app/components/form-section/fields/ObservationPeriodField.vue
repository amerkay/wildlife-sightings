<script setup lang="ts">
import { computed } from "vue";
import { useFormContext } from "vee-validate";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { DateRangePickerField } from "./";

interface Props {
  fieldNameFrom: string;
  fieldNameTo: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: "Select observation period",
});

const { values, setFieldValue } = useFormContext();

// Helper function to get nested value from form values
function getNestedValue(obj: any, path: string) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Create a computed property that combines the two date fields into a range string
const rangeValue = computed({
  get() {
    const fromValue = getNestedValue(values, props.fieldNameFrom);
    const toValue = getNestedValue(values, props.fieldNameTo);

    if (fromValue && toValue) {
      return `${fromValue} to ${toValue}`;
    } else if (fromValue) {
      return fromValue;
    }
    return "";
  },
  set(value: string) {
    if (!value) {
      setFieldValue(props.fieldNameFrom, "");
      setFieldValue(props.fieldNameTo, "");
      return;
    }

    if (value.includes(" to ")) {
      const [from, to] = value.split(" to ");
      setFieldValue(props.fieldNameFrom, from || "");
      setFieldValue(props.fieldNameTo, to || "");
    } else {
      setFieldValue(props.fieldNameFrom, value);
      setFieldValue(props.fieldNameTo, "");
    }
  },
});

// Create a mock componentField object for the DateRangePickerField
const componentField = computed(() => ({
  modelValue: rangeValue.value,
  "onUpdate:modelValue": (value: string) => {
    rangeValue.value = value;
  },
  onBlur: () => {},
  name: `${props.fieldNameFrom}-${props.fieldNameTo}`,
}));
</script>

<template>
  <FormField :name="fieldNameFrom" v-slot="{ errorMessage }">
    <FormItem class="flex flex-col">
      <FormLabel>
        {{ label }}
        <span v-if="required" class="text-destructive">*</span>
      </FormLabel>
      <FormDescription v-if="description">
        {{ description }}
      </FormDescription>
      <FormControl>
        <DateRangePickerField
          v-bind="componentField"
          :placeholder="placeholder"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
