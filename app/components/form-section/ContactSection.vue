<script setup lang="ts">
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-medium">Your Details</h2>

    <div class="grid gap-6 sm:grid-cols-2">
      <FormField name="contact.name" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input placeholder="Your full name" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="contact.email" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder="you@example.com"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="contact.postcode" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>Postcode (optional)</FormLabel>
          <FormControl>
            <Input placeholder="e.g., G2 1AA" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
  </section>
</template>
