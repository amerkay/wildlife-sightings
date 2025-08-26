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

## Bird Identification APIs (Docker)

This project includes AI-powered bird identification APIs for both audio and image analysis.

### Quick Start (Development)

```bash
# Option 1: Use the deployment script (recommended)
./deploy.sh dev

# Option 2: Manual start
docker compose up -d

# APIs will be available at:
# Audio API: http://localhost:8028/api/audio/
# Image API: http://localhost:8028/api/image/
# Traefik Dashboard: http://localhost:8029
```

### Testing the APIs

````bash
# Test audio API
curl -v -X POST -F "file=@./api/birdnet/examples/barnowl.mp3" \
  "http://localhost:8028/api/audio/predict?top_k=5&min_conf=0.0" | jq

# Test image API
curl -v -X POST -F "file=@./api/inat21/examples/barnowl-1.jpg" \
  "http://localhost:8028/api/image/classify?top_k=5&min_conf=0.0" | jq

# Health check
curl -s "http://localhost:8028/api/image/healthz" | jq
```### Production Deployment

1. **Configure environment variables:**

   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with your production values:
   # - DOMAIN=yourdomain.com
   # - ACME_EMAIL=your-email@example.com
   # - ENVIRONMENT=prod
````

2. **Deploy with HTTPS and Let's Encrypt:**

   ```bash
   # Option 1: Use the deployment script (recommended)
   ./deploy.sh prod

   # Option 2: Manual deployment
   docker compose -f docker compose.yml -f docker compose.prod.yml --env-file .env.prod up -d
   ```

3. **APIs will be available at:**
   - Audio API: `https://yourdomain.com/api/audio/`
   - Image API: `https://yourdomain.com/api/image/`
   - Traefik dashboard is disabled in production

### Useful Commands

```bash
# Start development environment
./deploy.sh dev

# Start production environment
./deploy.sh prod

# Stop all services
./deploy.sh stop

# View logs
./deploy.sh logs
```

### Configuration

The setup uses Traefik as a reverse proxy with:

- **Development**: HTTP only, dashboard enabled at `:8080`
- **Production**: HTTPS with automatic Let's Encrypt certificates, dashboard disabled

Environment variables can be configured in `.env` (dev) or `.env.prod` (production).

---

## To deploy to production

Configure redirects in Supabase Auth settings:
https://supabase.com/dashboard/project/zmlzutmqeacsgjsdealn/auth/url-configuration
