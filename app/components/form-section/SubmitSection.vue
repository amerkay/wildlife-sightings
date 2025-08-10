<script setup lang="ts">
import {
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
</script>

<template>
  <section class="space-y-4">
    <p class="text-sm text-muted-foreground">
      By submitting, you agree to our data sharing & confidentiality policy.
    </p>

    <div class="flex gap-3">
      <Button type="submit">Submit Sighting</Button>
      <Button type="reset" variant="secondary">Reset Form</Button>
    </div>
  </section>
</template>
