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
    firstName: z
      .string({ error: "First name is required" })
      .min(1, "First name is required"),
    lastName: z
      .string({ error: "Last name is required" })
      .min(1, "Last name is required"),
    email: z.email("Please enter a valid email address"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
      },
    },
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
  const success = await signUp(
    values.email,
    values.password,
    values.firstName,
    values.lastName
  );
  if (success) {
    toast.success(
      "Account created successfully! Please check your email to verify your account."
    );
  }
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <Container class="flex items-center justify-center py-12 lg:order-2">
      <Card class="mx-auto max-w-sm min-w-xs sm:min-w-sm">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Max" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="lastName">
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Robinson" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full">Create an account</Button>
            <!-- <Button variant="outline" type="button" class="w-full">
              Sign up with GitHub
            </Button> -->
          </form>

          <div class="mt-4 text-center text-sm">
            Already have an account?
            <NuxtLink to="/auth/login" class="underline">Sign in</NuxtLink>
          </div>
        </CardContent>
      </Card>
    </Container>

    <div class="hidden bg-muted lg:block lg:order-1">
      <img
        src="/signup-owl.jpg"
        alt="Image"
        width="1920"
        height="1080"
        class="h-full w-full object-cover dark:brightness-[0.8]"
      />
    </div>
  </div>
</template>
