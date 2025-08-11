<script lang="ts">
import * as z from "zod";
export const contactSchema = z.object({
  name: z
    .string()
    .nullable()
    .transform((val) => val || "")
    .pipe(
      z
        .string()
        .min(1, "Name is required")
        .max(200, "Name must be under 200 characters")
    )
    .describe("Your full name"),
  email: z
    .string()
    .nullable()
    .transform((val) => val || "")
    .pipe(
      z
        .email("Enter a valid email")
        .max(320, "Email must be under 320 characters")
    )
    .describe("Your email address"),
  postcode: z
    .string()
    .nullable()
    .transform((val) => val || "")
    .pipe(z.string().max(20, "Postcode must be under 20 characters"))
    .describe("Your postcode"),
});
</script>

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
          <FormLabel>
            Name
            <span class="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input placeholder="Your full name" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="contact.email" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>
            Email
            <span class="text-destructive">*</span>
          </FormLabel>
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
