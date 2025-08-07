<script setup lang="ts">
const user = useSupabaseUser();

watchEffect(() => {
  if (user.value) {
    return navigateTo("/my/");
  }
});
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <Container class="flex items-center justify-center py-12">
      <Card class="mx-auto max-w-sm min-w-xs sm:min-w-sm">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a password reset link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-center space-y-4">
            <div
              class="rounded-full bg-green-100 dark:bg-green-900 p-3 mx-auto w-fit"
            >
              <svg
                class="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p class="text-sm text-muted-foreground">
              Please check your email and click the link to reset your password.
              The link will expire in 24 hours.
            </p>
          </div>

          <div class="mt-6 text-center text-sm">
            Didn't receive the email?
            <NuxtLink to="/auth/forgot-password" class="underline">
              Try again
            </NuxtLink>
          </div>

          <div class="mt-4 text-center text-sm">
            <NuxtLink to="/auth/login" class="underline">
              Back to login
            </NuxtLink>
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
