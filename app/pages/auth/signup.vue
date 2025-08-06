<script lang="ts"></script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <div class="flex items-center justify-center py-12 lg:order-2">
      <Card class="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle> Sign Up </CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="first-name">First name</Label>
                <Input id="first-name" placeholder="Max" required />
              </div>
              <div class="grid gap-2">
                <Label for="last-name">Last name</Label>
                <Input id="last-name" placeholder="Robinson" required />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button type="submit" class="w-full"> Create an account </Button>
            <Button variant="outline" class="w-full">
              Sign up with GitHub
            </Button>
          </div>
          <div class="mt-4 text-center text-sm">
            Already have an account?
            <a href="#" class="underline"> Sign in </a>
          </div>
        </CardContent>
      </Card>
    </div>

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
