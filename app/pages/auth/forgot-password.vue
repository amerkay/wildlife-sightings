<script setup lang="ts">
import { toast } from "vue-sonner";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

const supabase = useSupabaseClient();
const user = useSupabaseUser();

watchEffect(() => {
  if (user.value) {
    return navigateTo("/my/");
  }
});

const formSchema = toTypedSchema(
  z.object({
    email: z.email("Please enter a valid email address"),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const isLoading = ref(false);

const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });
  if (error) {
    displayError(error);
    return false;
  }
  return true;
};

const displayError = (error: any) => {
  toast.error(error.message);
};

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const success = await requestPasswordReset(values.email);
    if (success) {
      // Redirect to success page instead of showing toast
      await navigateTo("/auth/reset-sent");
    }
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <Container class="flex items-center justify-center py-12">
      <Card class="mx-auto max-w-sm min-w-xs sm:min-w-sm">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-4">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Sending..." : "Send Reset Link" }}
            </Button>
          </form>

          <div class="mt-4 text-center text-sm">
            Remember your password?
            <NuxtLink to="/auth/login" class="underline">Sign in</NuxtLink>
          </div>
        </CardContent>
      </Card>
    </Container>
    <div class="hidden bg-muted lg:block">
      <img
        src="/login-owl.jpg"
        alt="Image"
        width="1920"
        height="1080"
        class="h-full w-full object-cover dark:brightness-[0.99]"
      />
    </div>
  </div>
</template>
