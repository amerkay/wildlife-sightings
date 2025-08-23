<script setup lang="ts">
import { ref } from "vue";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";

interface Props {
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: "e.g., May 2008 to Winter 2012/13",
});

const isVisible = ref(false);

function showField() {
  isVisible.value = true;
}
</script>

<template>
  <div>
    <!-- Show button when field is not visible -->
    <Button
      v-if="!isVisible"
      type="button"
      variant="outline"
      size="sm"
      @click="showField"
      class="text-sm"
    >
      <Plus class="mr-2 h-4 w-4" />
      Add observation period details
    </Button>

    <!-- Show field when visible -->
    <FormField v-if="isVisible" :name="fieldName" v-slot="{ componentField }">
      <FormItem class="flex flex-col">
        <FormLabel>
          {{ label }}
          <span v-if="required" class="text-destructive">*</span>
        </FormLabel>
        <FormDescription v-if="description">
          {{ description }}
        </FormDescription>
        <FormControl>
          <Input
            v-bind="componentField"
            :placeholder="placeholder"
            maxlength="30"
            class="w-full sm:w-[320px]"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </div>
</template>
