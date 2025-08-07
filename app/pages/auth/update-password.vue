<script setup lang="ts">
import { toast } from "vue-sonner";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();

// Check if this is a password recovery session
const isPasswordRecovery = ref(false);

watchEffect(() => {
  // Check for password recovery in URL params or session
  if (route.query.type === "recovery" || route.hash.includes("type=recovery")) {
    isPasswordRecovery.value = true;
  }
});

const formSchema = toTypedSchema(
  z
    .object({
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })
);

const form = useForm({
  validationSchema: formSchema,
});

const isLoading = ref(false);

const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({
    password: password,
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
    const success = await updatePassword(values.password);
    if (success) {
      toast.success("Password updated successfully!");
      // Redirect to login page after successful password update
      await navigateTo("/auth/login");
    }
  } finally {
    isLoading.value = false;
  }
});

// Listen for auth state changes to detect password recovery
onMounted(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      isPasswordRecovery.value = true;
    }
  });
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <Container class="flex items-center justify-center py-12">
      <Card class="mx-auto max-w-sm min-w-xs sm:min-w-sm">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription> Enter your new password below </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-4">
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmPassword">
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              {{ isLoading ? "Updating..." : "Update Password" }}
            </Button>
          </form>

          <div class="mt-4 text-center text-sm">
            <NuxtLink to="/auth/login" class="underline"
              >Back to login</NuxtLink
            >
          </div>
        </CardContent>
      </Card>
    </Container>
    <div class="hidden bg-muted lg:block">
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
