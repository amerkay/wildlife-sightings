<script setup lang="ts">
import { h, watch, computed, ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

/* UI */
import { toast } from "vue-sonner";

/* Sections */
import TypeSection from "@/components/form-section/TypeSection.vue";
import LocationSection from "@/components/form-section/LocationSection.vue";
import LiveSection from "@/components/form-section/LiveSection.vue";
import RoostNestSiteSection from "~/components/form-section/RoostNestSiteSection.vue";
import DeadSection from "@/components/form-section/DeadSection.vue";
import ContactSection from "@/components/form-section/ContactSection.vue";
import SubmitSection from "@/components/form-section/SubmitSection.vue";

/* reCAPTCHA v3 — kept but commented out per request */
// import { useReCaptcha } from 'vue-recaptcha-v3'

/* ---------------- Schema ---------------- */
const locationSchema = z.object({
  lat: z
    .number({ error: "Please select a location on the map" })
    .nullable()
    .refine((val) => val !== null, {
      message: "Please select a location on the map",
    }),
  lng: z
    .number({ error: "Please select a location on the map" })
    .nullable()
    .refine((val) => val !== null, {
      message: "Please select a location on the map",
    }),
  // placeName: z.string().min(1, "Place name / road number is required"),
  // county: z.string().optional().default(""),
  notes: z
    .string()
    .max(700, "Keep location notes under 700 chars")
    .optional()
    .or(z.literal("")),
});

const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters"),
  email: z
    .email("Enter a valid email")
    .max(320, "Email must be under 320 characters"),
  postcode: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.length <= 20, {
      message: "Postcode must be under 20 characters",
    }),
});

const liveSchema = z
  .object({
    sightingDate: z.coerce.date({ error: "Date of sighting is required" }),
    frequency: z
      .enum(["once", "weekly", "monthly", "less-monthly"])
      .optional()
      .or(z.literal("")),
    activity: z
      .enum(["driving", "walking", "home", "other"])
      .optional()
      .or(z.literal("")),
    activityOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Activity description must be under 200 characters",
      }),
    observationPeriodFrom: z.union([z.coerce.date(), z.literal("")]).optional(),
    observationPeriodTo: z.union([z.coerce.date(), z.literal("")]).optional(),
  })
  .refine(
    (v) =>
      v.activity !== "other" ||
      (v.activityOther && v.activityOther.trim().length > 0),
    { path: ["activityOther"], message: "Please describe the activity" }
  );

const siteSchema = z
  .object({
    sightingDate: z.coerce.date({
      error: "Approx. date of last Roosted/Nested is required",
    }),
    observed: z
      .array(
        z.enum([
          "nest",
          "roost-regular",
          "roost-occasional",
          "fly-in-out",
          "carrying-food",
          "young-heard",
        ])
      )
      .optional()
      .default([]),
    siteType: z
      .enum([
        "traditional-farm",
        "modern-farm",
        "mixed-farm",
        "tree-hole",
        "other",
      ])
      .optional()
      .or(z.literal("")),
    siteTypeOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Site description must be under 200 characters",
      }),
    nestbox: z.enum(["yes", "no", "unknown"]).optional().or(z.literal("")),
    connection: z
      .enum(["owner", "tenant", "watcher", "other"])
      .optional()
      .or(z.literal("")),
    connectionOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Connection description must be under 200 characters",
      }),
    observationPeriodFrom: z.union([z.coerce.date(), z.literal("")]).optional(),
    observationPeriodTo: z.union([z.coerce.date(), z.literal("")]).optional(),
  })
  .refine(
    (v) =>
      v.siteType !== "other" ||
      (v.siteTypeOther && v.siteTypeOther.trim().length > 0),
    { path: ["siteTypeOther"], message: "Please describe the site" }
  )
  .refine(
    (v) =>
      v.connection !== "other" ||
      (v.connectionOther && v.connectionOther.trim().length > 0),
    { path: ["connectionOther"], message: "Please describe your connection" }
  );

const deadSchema = z
  .object({
    sightingDate: z.coerce.date({ error: "Date found is required" }),
    cause: z
      .enum([
        "road-minor",
        "road-major",
        "road-motorway",
        "powerlines",
        "railway",
        "drowned",
        "unknown",
        "other",
      ])
      .optional()
      .or(z.literal("")),
    causeOther: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 200, {
        message: "Cause description must be under 200 characters",
      }),
    details: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.length <= 700, {
        message: "Details must be under 700 characters",
      }),
  })
  .refine(
    (v) =>
      v.cause !== "other" || (v.causeOther && v.causeOther.trim().length > 0),
    { path: ["causeOther"], message: "Please describe the cause" }
  );

/* Create individual form schemas for each type */
const liveFormSchema = z.object({
  type: z.literal("live"),
  location: locationSchema,
  live: liveSchema,
  contact: contactSchema,
  captcha: z.string().min(0).optional().or(z.literal("")),
});

const siteFormSchema = z.object({
  type: z.literal("site"),
  location: locationSchema,
  site: siteSchema,
  contact: contactSchema,
  captcha: z.string().min(0).optional().or(z.literal("")),
});

const deadFormSchema = z.object({
  type: z.literal("dead"),
  location: locationSchema,
  dead: deadSchema,
  contact: contactSchema,
  captcha: z.string().min(0).optional().or(z.literal("")),
});

/* Reactive type reference */
const typeRef = ref<"live" | "site" | "dead">("live");

/* Reactive schema based on current type */
const currentSchema = computed(() => {
  const t = typeRef.value;
  return toTypedSchema(
    t === "live"
      ? liveFormSchema
      : t === "site"
      ? siteFormSchema
      : deadFormSchema
  );
});

/* -------------- useForm -------------- */
const { handleSubmit, resetForm, setFieldValue, values, defineField } = useForm(
  {
    validationSchema: currentSchema,
    initialValues: {
      type: "live",
      location: {
        lat: null,
        lng: null,
        // placeName: "",
        // county: "",
        notes: "",
      },
      live: {
        sightingDate: "",
        frequency: undefined,
        activity: undefined,
        activityOther: "",
        observationPeriodFrom: "",
        observationPeriodTo: "",
      },
      site: {
        sightingDate: "",
        observed: [],
        siteType: undefined,
        siteTypeOther: "",
        nestbox: "unknown",
        connection: undefined,
        connectionOther: "",
        observationPeriodFrom: "",
        observationPeriodTo: "",
      },
      dead: { sightingDate: "", cause: undefined, causeOther: "", details: "" },
      contact: { name: "", email: "", postcode: "" },
      captcha: "",
    } as any,
  }
);
const [typeField] = defineField("type");

/* Sync typeRef with form value */
watch(
  () => values.type,
  (newType) => {
    if (newType) {
      typeRef.value = newType as "live" | "site" | "dead";
    }
  },
  { immediate: true }
);

/* Also sync the other way for initial value */
watch(
  typeRef,
  (newType) => {
    if (values.type !== newType) {
      setFieldValue("type", newType);
    }
  },
  { immediate: true }
);

/* Cleanup "other" fields when their controller changes */
watch(
  () => values.live?.activity,
  (v) => {
    if (v !== "other") setFieldValue("live.activityOther", "");
  }
);
watch(
  () => values.site?.siteType,
  (v) => {
    if (v !== "other") setFieldValue("site.siteTypeOther", "");
  }
);
watch(
  () => values.site?.connection,
  (v) => {
    if (v !== "other") setFieldValue("site.connectionOther", "");
  }
);
watch(
  () => values.dead?.cause,
  (v) => {
    if (v !== "other") setFieldValue("dead.causeOther", "");
  }
);
watch(
  typeRef,
  (t) => {
    if (t === "site" && !values.site) {
      setFieldValue("site", {
        sightingDate: "",
        observed: [],
        siteType: undefined,
        siteTypeOther: "",
        nestbox: "unknown",
        connection: undefined,
        connectionOther: "",
        observationPeriodFrom: "",
        observationPeriodTo: "",
      });
    }
    if (t === "dead" && !values.dead) {
      setFieldValue("dead", {
        sightingDate: "",
        cause: undefined,
        causeOther: "",
        details: "",
      });
    }
  },
  { immediate: true }
);

/* reCAPTCHA flow — kept but commented out per your request */
// const { executeRecaptcha, recaptchaLoaded } = useReCaptcha()
// async function onSubmitWithCaptcha(e: Event) {
//   e.preventDefault()
//   try {
//     await recaptchaLoaded()
//     const token = await executeRecaptcha('owl_sighting_submit')
//     setFieldValue('captcha', token)
//   } catch {
//     toast({ title: 'reCAPTCHA failed', description: 'Please try again.', variant: 'destructive' })
//     return
//   }
//   submit()
// }

const submit = handleSubmit(
  async (formValues) => {
    try {
      const supabase = useSupabaseClient();
      const user = useSupabaseUser();

      // Base sighting data
      const sightingData: any = {
        type: formValues.type,
        user_id: user.value?.id || null,

        // Location as PostGIS point
        location: `POINT(${formValues.location.lng} ${formValues.location.lat})`,
        location_notes: formValues.location.notes || null,

        // Contact info
        contact_name: formValues.contact.name,
        contact_email: formValues.contact.email,
        contact_postcode: formValues.contact.postcode || null,

        // Metadata
        status: "pending",
      };

      // Add type-specific data
      if (formValues.type === "live") {
        sightingData.sighting_date = formValues.live.sightingDate;
        // Convert dates to DATE format (YYYY-MM-DD) for database
        sightingData.observation_period_from = formValues.live
          .observationPeriodFrom
          ? new Date(formValues.live.observationPeriodFrom)
              .toISOString()
              .split("T")[0]
          : null;
        sightingData.observation_period_to = formValues.live.observationPeriodTo
          ? new Date(formValues.live.observationPeriodTo)
              .toISOString()
              .split("T")[0]
          : null;
        sightingData.frequency = formValues.live.frequency || null;
        sightingData.activity = formValues.live.activity || null;
        sightingData.activity_other =
          formValues.live.activity === "other"
            ? formValues.live.activityOther
            : null;
      } else if (formValues.type === "site") {
        sightingData.sighting_date = formValues.site.sightingDate;
        // Convert dates to DATE format (YYYY-MM-DD) for database
        sightingData.observation_period_from = formValues.site
          .observationPeriodFrom
          ? new Date(formValues.site.observationPeriodFrom)
              .toISOString()
              .split("T")[0]
          : null;
        sightingData.observation_period_to = formValues.site.observationPeriodTo
          ? new Date(formValues.site.observationPeriodTo)
              .toISOString()
              .split("T")[0]
          : null;
        sightingData.observed = formValues.site.observed || [];
        sightingData.site_type = formValues.site.siteType || null;
        sightingData.site_type_other =
          formValues.site.siteType === "other"
            ? formValues.site.siteTypeOther
            : null;
        sightingData.nestbox = formValues.site.nestbox || "unknown";
        sightingData.connection = formValues.site.connection || null;
        sightingData.connection_other =
          formValues.site.connection === "other"
            ? formValues.site.connectionOther
            : null;
      } else if (formValues.type === "dead") {
        sightingData.sighting_date = formValues.dead.sightingDate;
        sightingData.cause_of_death = formValues.dead.cause || null;
        sightingData.cause_of_death_other =
          formValues.dead.cause === "other" ? formValues.dead.causeOther : null;
        sightingData.death_details = formValues.dead.details || null;
      }

      const { data, error } = await supabase
        .from("sightings")
        .insert(sightingData)
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

      // Redirect to dashboard after successful submission
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

const showLive = computed(() => typeRef.value === "live");
const showSite = computed(() => typeRef.value === "site");
const showDead = computed(() => typeRef.value === "dead");

const currentSection = computed(() => {
  if (showLive.value) return LiveSection;
  if (showSite.value) return RoostNestSiteSection;
  if (showDead.value) return DeadSection;
  return LiveSection;
});
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
      <TypeSection v-model="typeRef" />

      <Transition name="section-fade" mode="out-in">
        <KeepAlive>
          <component :is="currentSection" :key="typeRef" />
        </KeepAlive>
      </Transition>
      <ContactSection />
      <SubmitSection />
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
