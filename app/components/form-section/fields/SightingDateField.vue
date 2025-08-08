<script setup lang="ts">
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { DatePickerField } from "./";
import { QuickDateButtons } from "./";

interface Props {
  fieldName: string;
  label: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
});
</script>

<template>
  <FormField :name="fieldName" v-slot="{ componentField, errorMessage }">
    <FormItem class="flex flex-col">
      <FormLabel>
        {{ label }}
        <span v-if="required" class="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DatePickerField v-bind="componentField" />
          <QuickDateButtons :on-set-date="componentField.onChange" />
        </div>
      </FormControl>
      <p v-if="errorMessage" class="text-sm text-destructive mt-1">
        {{ errorMessage }}
      </p>
    </FormItem>
  </FormField>
</template>
