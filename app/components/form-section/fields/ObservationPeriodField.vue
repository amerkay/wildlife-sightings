<script setup lang="ts">
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
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: "Select observation period",
});
</script>

<template>
  <FormField :name="fieldName" v-slot="{ componentField }">
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
