<script setup lang="ts">
import { Field } from "vee-validate";

interface Props {
  name: string;
}

defineProps<Props>();
</script>

<template>
  <div>
    <!-- Hidden lat/lng fields for validation -->
    <Field :name="`${name}.lat`" v-slot="{ field, errorMessage }">
      <input type="hidden" v-bind="field" />
      <p v-if="errorMessage" class="text-sm text-destructive mt-2">
        {{ errorMessage }}
      </p>
    </Field>
    <Field :name="`${name}.lng`" v-slot="{ field }">
      <input type="hidden" v-bind="field" />
    </Field>
    <!-- Hidden water validation field -->
    <Field :name="`${name}.isOnLand`" v-slot="{ field, errorMessage }">
      <input type="hidden" v-bind="field" />
      <p v-if="errorMessage" class="text-sm text-destructive mt-2">
        {{ errorMessage }}
      </p>
    </Field>
  </div>
</template>
