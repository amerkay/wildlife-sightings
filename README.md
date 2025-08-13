# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## How to run the project in dev mode

```bash
# On Windows:
# choco install pnpm

pnpm install

# On one tab
pnpm supabase:start

# Make a copy of the .env.example file to .env
```

There are 2 `.env` files that need to be set up before running the project.

Now we need to setup the main .env file.

1. Copy the `.env.example` file to `.env` and fill in SUPABASE_KEY.
2. To get the `SUPABASE_KEY`, go to http://localhost:54323/, click the user icon in the top right corner, click `Command`, then search key. Copy the Anonymous API key.

Now we need to setup the functions .env file.

1. Copy the `./supabase/functions/.env.example` file to `./supabase/functions/.env` and fill in the `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. To get the `SUPABASE_ANON_KEY`, go to http://localhost:54323/, click the user icon in the top right corner, click `Command`, then search key. Copy the Anonymous API key.
3. To get the `SUPABASE_SERVICE_ROLE_KEY`, copy the `Service API Key`.

**Now we run the project:**

This is

```sh
# in one terminal tab:
pnpm supabase:start
pnpm supabase:serve-functions

# in another terminal tab:
pnpm generate && pnpm preview
# Or pnpm dev for dev mode

# Don't forget to run to stop
pnpm supabase:stop
```

---

## To deploy to production

Configure redirects in Supabase Auth settings:
https://supabase.com/dashboard/project/zmlzutmqeacsgjsdealn/auth/url-configuration
