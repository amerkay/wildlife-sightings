<script setup lang="ts">
import { computed, ref } from "vue";
import { useForm, useIsFormValid } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

/* UI */
import { toast } from "vue-sonner";

/* Sections */
import TypeSection from "@/components/form-section/TypeSection.vue";
import LocationSection, {
  locationSchema,
} from "@/components/form-section/LocationSection.vue";
import LiveSection, {
  liveSchema,
} from "@/components/form-section/LiveSection.vue";
import RoostNestSiteSection, {
  siteSchema,
} from "~/components/form-section/RoostNestSiteSection.vue";
import DeadSection, {
  deadSchema,
} from "@/components/form-section/DeadSection.vue";
import ContactSection, {
  contactSchema,
} from "@/components/form-section/ContactSection.vue";

/* Auth */
const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value);
const isAnon = computed(() => !isLoggedIn.value);
const userDisplayName = computed(() => {
  if (!user.value) return "";

  const firstName = (user.value.user_metadata as any)?.first_name;
  const lastName = (user.value.user_metadata as any)?.last_name;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return user.value.email || "";
});

/* ---------------------------------- */
/* tiny helpers (UI -> DB normalization) */
// Accepts string | Date | "" | undefined | null
const toYMD = (d?: string | Date | null) => {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  const time = date?.getTime?.();
  if (!time || Number.isNaN(time)) return null;
  return date.toISOString().slice(0, 10);
};

const nullIfEmpty = (s?: string | null) =>
  s && s.trim().length > 0 ? s : null;

const point = (lng: number | null, lat: number | null) =>
  lng != null && lat != null ? `POINT(${lng} ${lat})` : null;

/* ---------------------------------- */
/* contact derivation helper */
const deriveContactInfo = (
  loggedIn: boolean,
  user: ReturnType<typeof useSupabaseUser>["value"],
  formContact?: any
) => {
  if (loggedIn && user) {
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

    return {
      name: fullName || user.email?.split("@")[0] || null,
      email: user.email ?? null,
      postcode: user.user_metadata?.postcode || null,
    };
  }

  return {
    name: nullIfEmpty(formContact?.name),
    email: nullIfEmpty(formContact?.email),
    postcode: nullIfEmpty(formContact?.postcode),
  };
};

/* ---------------------------------- */
/* defaults (keeps initialValues short) */
const locationDefaults = {
  lat: null as number | null,
  lng: null as number | null,
  notes: "",
};
const liveDefaults = {
  frequency: undefined as string | undefined,
  activity: undefined as string | undefined,
  activityOther: "",
  observationPeriodFrom: "",
  observationPeriodTo: "",
};
const siteDefaults = {
  observed: [] as string[],
  siteType: undefined as string | undefined,
  siteTypeOther: "",
  nestbox: "unknown",
  connection: undefined as string | undefined,
  connectionOther: "",
  observationPeriodFrom: "",
  observationPeriodTo: "",
};
const deadDefaults = {
  cause: undefined as string | undefined,
  causeOther: "",
  details: "",
};
const contactDefaults = { name: null, email: null, postcode: null };

/* ---------------------------------- */
/* unified schema (discriminated union) */
type ReportType = "live" | "site" | "dead";

const baseUnionSchema = (loggedIn: boolean) =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("live"),
      sightingDate: z.coerce
        .date({ message: "Date of sighting is required" })
        .max(new Date(), "Date cannot be in the future")
        .describe("Date when you saw the barn owl"),
      location: locationSchema,
      live: liveSchema,
      contact: loggedIn ? contactSchema.optional() : contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("site"),
      sightingDate: z.coerce
        .date({ message: "Date of sighting is required" })
        .max(new Date(), "Date cannot be in the future")
        .describe("Date when you observed the roost/nest site"),
      location: locationSchema,
      site: siteSchema,
      contact: loggedIn ? contactSchema.optional() : contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("dead"),
      sightingDate: z.coerce
        .date({ message: "Date found is required" })
        .max(new Date(), "Date cannot be in the future")
        .describe("Date when you found the barn owl"),
      location: locationSchema,
      dead: deadSchema,
      contact: loggedIn ? contactSchema.optional() : contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
  ]);

/**
 * Schema that validates UI values AND produces a DB-ready payload (snake_case).
 * We capture user state so contact_* can be derived when logged in.
 */
const dbPayloadSchema = (
  loggedIn: boolean,
  u: ReturnType<typeof useSupabaseUser>["value"]
) =>
  baseUnionSchema(loggedIn).transform((v) => {
    // Derive contact info for database (prioritize user data if logged in)
    const derivedContact = deriveContactInfo(loggedIn, u, v.contact);

    const base = {
      type: v.type,
      user_id: u?.id ?? null,
      // location
      location: point(v.location.lng, v.location.lat),
      location_notes: nullIfEmpty(v.location.notes),
      // contact - required fields for database
      contact_name: derivedContact.name,
      contact_email: derivedContact.email,
      contact_postcode: derivedContact.postcode,
      // metadata
      status: "pending" as const,
    };
    if (v.type === "live") {
      return {
        ...base,
        sighting_date: v.sightingDate,
        observation_period_from: toYMD(v.live.observationPeriodFrom),
        observation_period_to: toYMD(v.live.observationPeriodTo),
        frequency: v.live.frequency ?? null,
        activity: v.live.activity ?? null,
        activity_other:
          v.live.activity === "other"
            ? nullIfEmpty(v.live.activityOther)
            : null,
      };
    }

    if (v.type === "site") {
      return {
        ...base,
        sighting_date: v.sightingDate,
        observation_period_from: toYMD(v.site.observationPeriodFrom),
        observation_period_to: toYMD(v.site.observationPeriodTo),
        observed: v.site.observed ?? [],
        site_type: v.site.siteType ?? null,
        site_type_other:
          v.site.siteType === "other"
            ? nullIfEmpty(v.site.siteTypeOther)
            : null,
        nestbox: v.site.nestbox ?? "unknown",
        connection: v.site.connection ?? null,
        connection_other:
          v.site.connection === "other"
            ? nullIfEmpty(v.site.connectionOther)
            : null,
      };
    }

    // dead
    return {
      ...base,
      sighting_date: v.sightingDate,
      cause_of_death: v.dead.cause ?? null,
      cause_of_death_other:
        v.dead.cause === "other" ? nullIfEmpty(v.dead.causeOther) : null,
      death_details: nullIfEmpty(v.dead.details),
    };
  });

/* Vee-validate schema for the FORM (no transform here) */
const validationSchema = computed(() =>
  toTypedSchema(baseUnionSchema(isLoggedIn.value))
);

/* initial form values (concise, composable) */
const derivedContactInfo = deriveContactInfo(isLoggedIn.value, user.value);
const initialValues = {
  type: "live" as ReportType,
  sightingDate: new Date().toISOString().slice(0, 10),
  location: { ...locationDefaults },
  live: { ...liveDefaults },
  site: { ...siteDefaults },
  dead: { ...deadDefaults },
  contact: { ...contactDefaults, ...derivedContactInfo },
  captcha: "",
} as const;

/* -------------- useForm -------------- */
const { handleSubmit, resetForm, values, defineField, isSubmitting } = useForm({
  validationSchema: validationSchema,
  initialValues: initialValues as any,
});
// Reactive, schema-aware overall validity
const isFormValid = useIsFormValid();

// IMPORTANT FIX: no generic here, so it uses the path overload
const [type] = defineField("type");

/* Section component map (no if/else chain) */
const sections = {
  live: LiveSection,
  site: RoostNestSiteSection,
  dead: DeadSection,
} as const;

const currentSection = computed(
  () => sections[(type.value as ReportType) ?? "live"]
);

/* -------------- submit -------------- */
const token = ref<string>("");

// Captcha is only required for anonymous users
const isCaptchaOk = computed(() => (isAnon.value ? !!token.value : true));
// Final disable state for the button
const submitDisabled = computed(
  () => !isFormValid.value || !isCaptchaOk.value || isSubmitting.value
);
const showNotice = computed(() => !isFormValid.value || !isCaptchaOk.value);

const submit = handleSubmit(
  async () => {
    try {
      const supabase = useSupabaseClient();

      // Build DB payload in one line from validated UI values
      const payload = dbPayloadSchema(isLoggedIn.value, user.value).parse(
        values
      );

      // Call Edge Function with Turnstile token + payload
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "turnstile-verify",
        {
          // Send token only when needed; function tolerates undefined
          body: { token: isAnon.value ? token.value : undefined, payload },
        }
      );

      if (fnError) {
        console.error("Function error:", fnError);
        toast("Submission failed ❌", { description: fnError.message });
        return;
      }

      const referenceId = (fnData as any)?.id?.toString() || "unknown";
      const displayRefId = referenceId.slice(0, 8);
      toast.success("Sighting submitted ✅", {
        description: `Your sighting has been submitted successfully! Reference ID: ${displayRefId}...`,
      });

      await navigateTo(`/my/sightings/new-success?type=${type.value}`);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Submission failed ❌", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  },
  (errors) => {
    console.error("Validation errors:", errors.errors);
    toast.error("Please fix the errors", {
      description: "Some fields need your attention.",
    });
  }
);
</script>

<template>
  <Container>
    <form
      class="mx-auto w-full max-w-3xl space-y-10"
      @submit.prevent="submit"
      @reset="resetForm()"
    >
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold">Report an Owl Sighting</h1>

        <p class="text-muted-foreground">
          Please use this form to record any sightings of a Barn Owl. For help
          with identification see our
          <NuxtLink to="#">Identification Guide</NuxtLink>. Here is a link to
          our
          <a
            href="https://www.barnowltrust.org.uk/barn-owl-contact-directory/"
            target="_blank"
            rel="noopener noreferrer"
            >online directory</a
          >
          to find a local Barn Owl group in your area (who may offer nestbox
          installation/monitoring services).
        </p>
        <p v-if="isAnon" class="text-muted-foreground">
          If you are already registered with us please
          <NuxtLink to="/auth/login">Login</NuxtLink> before you start.
        </p>
      </header>

      <LocationSection :show-reverse-geo-fields="false" />
      <TypeSection v-model="type" />

      <Transition name="section-fade" mode="out-in">
        <KeepAlive>
          <component :is="currentSection" :key="type" />
        </KeepAlive>
      </Transition>

      <!-- Auth-aware contact section -->
      <!-- <div v-if="isLoggedIn" class="rounded-md border p-4 text-sm">
        Submitting as
        <strong>{{ userDisplayName }}</strong
        >.
      </div> -->
      <ContactSection v-if="!isLoggedIn" />

      <!-- Turnstile widget (anon only) -->
      <div v-if="isAnon">
        <NuxtTurnstile v-model="token" />
      </div>

      <!-- <SubmitSection :disabled="submitDisabled" /> -->
      <section class="space-y-4">
        <p class="text-sm text-muted-foreground">
          By submitting, you agree to our data sharing & confidentiality policy.
        </p>

        <div class="flex gap-3">
          <Button
            type="submit"
            size="lg"
            :disabled="submitDisabled"
            :aria-disabled="submitDisabled"
          >
            Submit Sighting
          </Button>
          <Button type="reset" size="lg" variant="ghost">Reset Form</Button>
        </div>

        <p v-if="showNotice" class="mt-2 text-sm text-red-500">
          Please complete fill all fields marked "<span class="text-red-500"
            >*</span
          >"<span v-if="isAnon"> and the captcha to enable submit</span>.
        </p>
      </section>

      <!-- Debug, show JSON formatted values -->
      <!-- <p>
        isFormValid {{ isFormValid }}, isCaptchaOk {{ isCaptchaOk }},
        isSubmitting {{ isSubmitting }}
      </p> -->
      <!-- <pre>{{ JSON.stringify(values, null, 2) }}</pre> -->
    </form>
  </Container>
</template>

<style scoped>
.section-fade-enter-active,
.section-fade-leave-active {
  transition: all 0.3s ease;
}
.section-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
