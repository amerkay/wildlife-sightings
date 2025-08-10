<script setup lang="ts">
import { computed } from "vue";
import { useForm } from "vee-validate";
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
import SubmitSection from "@/components/form-section/SubmitSection.vue";

/* Auth */
const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value);
const userDisplayName = computed(
  () =>
    (user.value?.user_metadata as any)?.full_name ||
    (user.value?.user_metadata as any)?.name ||
    user.value?.email ||
    ""
);

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
/* defaults (keeps initialValues short) */
const locationDefaults = {
  lat: null as number | null,
  lng: null as number | null,
  notes: "",
};
const liveDefaults = {
  sightingDate: "",
  frequency: undefined as string | undefined,
  activity: undefined as string | undefined,
  activityOther: "",
  observationPeriodFrom: "",
  observationPeriodTo: "",
};
const siteDefaults = {
  sightingDate: "",
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
  sightingDate: "",
  cause: undefined as string | undefined,
  causeOther: "",
  details: "",
};
const contactDefaults = { name: "", email: "", postcode: "" };

/* ---------------------------------- */
/* unified schema (discriminated union) */
type ReportType = "live" | "site" | "dead";

const baseUnionSchema = (loggedIn: boolean) =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("live"),
      location: locationSchema,
      live: liveSchema,
      contact: loggedIn ? z.never() : contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("site"),
      location: locationSchema,
      site: siteSchema,
      contact: loggedIn ? z.never() : contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("dead"),
      location: locationSchema,
      dead: deadSchema,
      contact: loggedIn ? z.never() : contactSchema,
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
    // contact derivation
    const derivedContact = loggedIn
      ? {
          name:
            ((u?.user_metadata as any)?.full_name ||
              (u?.user_metadata as any)?.name ||
              u?.email?.split("@")[0] ||
              null) ??
            null,
          email: u?.email ?? null,
          postcode: null,
        }
      : {
          name: nullIfEmpty((v as any).contact?.name),
          email: nullIfEmpty((v as any).contact?.email),
          postcode: nullIfEmpty((v as any).contact?.postcode),
        };

    const base = {
      type: v.type,
      user_id: u?.id ?? null,
      // location
      location: point(v.location.lng, v.location.lat),
      location_notes: nullIfEmpty(v.location.notes),
      // contact
      contact_name: derivedContact.name,
      contact_email: derivedContact.email,
      contact_postcode: derivedContact.postcode,
      // metadata
      status: "pending" as const,
    };

    if (v.type === "live") {
      return {
        ...base,
        sighting_date: v.live.sightingDate,
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
        sighting_date: v.site.sightingDate,
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
      sighting_date: v.dead.sightingDate,
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
const initialValues = {
  type: "live" as ReportType,
  location: { ...locationDefaults },
  live: { ...liveDefaults },
  site: { ...siteDefaults },
  dead: { ...deadDefaults },
  contact: { ...contactDefaults },
  captcha: "",
} as const;

/* -------------- useForm -------------- */
const { handleSubmit, resetForm, values, defineField } = useForm({
  validationSchema: validationSchema,
  initialValues: initialValues as any,
});

// IMPORTANT FIX: no generic here, so it uses the path overload
const [type] = defineField("type");

/* Section component map (no if/else chain) */
const sections = {
  live: LiveSection,
  site: RoostNestSiteSection,
  dead: DeadSection,
} as const;

const currentSection = computed(() => sections[type.value as ReportType]);

/* -------------- submit -------------- */
const submit = handleSubmit(
  async () => {
    try {
      const supabase = useSupabaseClient();

      // Build DB payload in one line from validated UI values
      const payload = dbPayloadSchema(isLoggedIn.value, user.value).parse(
        values
      );

      const { data, error } = await supabase
        .from("sightings")
        .insert(payload as any)
        .select("id")
        .single();

      if (error) {
        console.error("Supabase error:", error);
        toast("Submission failed ❌", {
          description: `Error: ${error.message}`,
        });
        return;
      }

      const referenceId =
        (data as any)?.id?.toString().slice(0, 8) || "unknown";
      toast.success("Sighting submitted ✅", {
        description: `Your sighting has been submitted successfully! Reference ID: ${referenceId}...`,
      });

      await navigateTo("/my/sightings/");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Submission failed ❌", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  },
  () => {
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
          All fields adjust based on what you’re reporting.
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
      <div v-if="isLoggedIn" class="rounded-md border p-4 text-sm">
        You are logged in as <strong>{{ userDisplayName }}</strong
        >. We’ll use your account details for contact.
      </div>
      <ContactSection v-else />

      <SubmitSection />

      <!-- Debug, show JSON formatted values -->
      <pre>{{ JSON.stringify(values, null, 2) }}</pre>
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
