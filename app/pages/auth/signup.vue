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
    postcode: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 20, {
        message: "Postcode must be under 20 characters",
      }),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const isLoading = ref(false);

const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  postcode?: string
) => {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        postcode: postcode || null,
      },

      emailRedirectTo: new URL("auth/confirm", siteUrl).toString(),
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
  isLoading.value = true;
  try {
    const success = await signUp(
      values.email,
      values.password,
      values.firstName,
      values.lastName,
      values.postcode
    );
    if (success) {
      await navigateTo("/auth/signup-success");
    }
  } finally {
    isLoading.value = false;
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

            <FormField v-slot="{ componentField }" name="postcode">
              <FormItem>
                <FormLabel>Postcode (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., G2 1AA" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Creating account..." : "Create an account" }}
            </Button>
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
        src="/imgs/BAROW-Owlet-on-branch-Richard-Tadman-B-CROPPED-OWLETS-PAGE-scaled-1.jpg"
        alt="Image"
        width="2513"
        height="2560"
        class="h-full w-full object-cover dark:brightness-[0.8]"
      />
    </div>
  </div>
</template>
