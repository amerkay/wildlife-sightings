<script setup lang="ts">
import { toast } from "vue-sonner";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

const supabase = useSupabaseClient();
const user = useSupabaseUser();

watchEffect(() => {
  if (user.value) {
    return navigateTo("/my/sightings/");
  }
});

const formSchema = toTypedSchema(
  z.object({
    email: z.email("Please enter a valid email address"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
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
  const success = await signIn(values.email, values.password);
  if (success) {
    toast.success("Successfully signed in!");
  }
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <Container class="flex items-center justify-center py-12">
      <Card class="mx-auto max-w-sm min-w-xs sm:min-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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

            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <div class="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </NuxtLink>
                </div>
                <FormControl>
                  <Input type="password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full">Login</Button>
            <!-- <Button variant="outline" type="button" class="w-full">
              Login with Google
            </Button> -->
          </form>

          <div class="mt-4 text-center text-sm">
            Don't have an account?
            <NuxtLink to="/auth/signup" class="underline">Sign up</NuxtLink>
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
