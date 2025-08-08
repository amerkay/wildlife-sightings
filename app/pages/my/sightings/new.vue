<script setup lang="ts">
import { h, watch, computed } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

/* UI */
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";

/* Sections */
import TypeSection from "@/components/form-section/TypeSection.vue";
import LocationSection from "@/components/form-section/LocationSection.vue";
import LiveSection from "@/components/form-section/LiveSection.vue";
import SiteSection from "@/components/form-section/SiteSection.vue";
import DeadSection from "@/components/form-section/DeadSection.vue";
import ContactSection from "@/components/form-section/ContactSection.vue";
import SubmitSection from "@/components/form-section/SubmitSection.vue";

/* reCAPTCHA v3 — kept but commented out per request */
// import { useReCaptcha } from 'vue-recaptcha-v3'

/* ---------------- Schema ---------------- */
const locationSchema = z.object({
  lat: z.number({ error: "Latitude required" }),
  lng: z.number({ error: "Longitude required" }),
  placeName: z.string().min(1, "Place name / road number is required"),
  county: z.string().optional().default(""),
  notes: z
    .string()
    .max(500, "Keep location notes under 500 chars")
    .optional()
    .or(z.literal("")),
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  postcode: z.string().optional().or(z.literal("")),
});

const liveSchema = z
  .object({
    date: z.coerce.date({ error: "Date of sighting is required" }),
    frequency: z.enum(["once", "weekly", "monthly", "less-monthly"], {
      error: "Select a frequency",
    }),
    activity: z.enum(["driving", "walking", "home", "other"], {
      error: "Select what you were doing",
    }),
    activityOther: z.string().optional().or(z.literal("")),
    observationPeriod: z.string().optional().or(z.literal("")),
  })
  .refine(
    (v) =>
      v.activity !== "other" ||
      (v.activityOther && v.activityOther.trim().length > 0),
    { path: ["activityOther"], message: "Please describe the activity" }
  );

const siteSchema = z
  .object({
    lastUseDate: z.coerce.date({
      error: "Approx. date of last use is required",
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
      .min(1, "Select at least one observation"),
    siteType: z.enum(
      ["traditional-farm", "modern-farm", "mixed-farm", "tree-hole", "other"],
      { error: "Select site type" }
    ),
    siteTypeOther: z.string().optional().or(z.literal("")),
    nestbox: z.enum(["yes", "no", "unknown"]).optional().or(z.literal("")),
    connection: z.enum(["owner", "tenant", "watcher", "other"], {
      error: "Select your connection",
    }),
    connectionOther: z.string().optional().or(z.literal("")),
    observationPeriod: z.string().optional().or(z.literal("")),
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
    dateFound: z.coerce.date({ error: "Date found is required" }),
    cause: z.enum(
      [
        "road-minor",
        "road-major",
        "road-motorway",
        "powerlines",
        "railway",
        "drowned",
        "unknown",
        "other",
      ],
      { error: "Select cause" }
    ),
    causeOther: z.string().optional().or(z.literal("")),
    details: z.string().optional().or(z.literal("")),
  })
  .refine(
    (v) =>
      v.cause !== "other" || (v.causeOther && v.causeOther.trim().length > 0),
    { path: ["causeOther"], message: "Please describe the cause" }
  );

const schema = toTypedSchema(
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("live"),
      location: locationSchema,
      live: liveSchema,
      contact: contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")), // keep field but not required while reCAPTCHA is commented
    }),
    z.object({
      type: z.literal("site"),
      location: locationSchema,
      site: siteSchema,
      contact: contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("dead"),
      location: locationSchema,
      dead: deadSchema,
      contact: contactSchema,
      captcha: z.string().min(0).optional().or(z.literal("")),
    }),
  ])
);

/* -------------- useForm -------------- */
const { handleSubmit, resetForm, setFieldValue, values, defineField } = useForm(
  {
    validationSchema: schema,
    initialValues: {
      type: "live",
      location: {
        lat: 53.4808,
        lng: -2.2426,
        placeName: "",
        county: "",
        notes: "",
      },
      live: {
        date: "",
        frequency: undefined,
        activity: undefined,
        activityOther: "",
        observationPeriod: "",
      },
      site: {
        lastUseDate: "",
        observed: [],
        siteType: undefined,
        siteTypeOther: "",
        nestbox: "unknown",
        connection: undefined,
        connectionOther: "",
        observationPeriod: "",
      },
      dead: { dateFound: "", cause: undefined, causeOther: "", details: "" },
      contact: { name: "", email: "", postcode: "" },
      captcha: "",
    } as any,
  }
);
const [typeField] = defineField("type");

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
  () => values.type,
  (t) => {
    if (t === "site" && !values.site) {
      setFieldValue("site", {
        lastUseDate: "",
        observed: [],
        siteType: undefined,
        siteTypeOther: "",
        nestbox: "unknown",
        connection: undefined,
        connectionOther: "",
        observationPeriod: "",
      });
    }
    if (t === "dead" && !values.dead) {
      setFieldValue("dead", {
        dateFound: "",
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
    // TODO: POST to your API
    toast({
      title: "Sighting submitted ✅",
      description: h(
        "pre",
        { class: "mt-2 w-[360px] rounded-md bg-slate-950 p-4" },
        h(
          "code",
          { class: "text-white text-xs" },
          JSON.stringify(formValues, null, 2)
        )
      ),
    });
    // resetForm()
  },
  () => {
    toast({
      title: "Please fix the errors",
      description: "Some fields need your attention.",
      variant: "destructive",
    });
  }
);

const showLive = computed(() => values.type === "live");
const showSite = computed(() => values.type === "site");
const showDead = computed(() => values.type === "dead");

const currentSection = computed(() => {
  if (showLive.value) return LiveSection;
  if (showSite.value) return SiteSection;
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

      <TypeSection v-model="typeField" />
      <LocationSection />
      <KeepAlive>
        <component :is="currentSection" :key="values.type" />
      </KeepAlive>
      <ContactSection />
      <SubmitSection />
    </form>
  </Container>
</template>
