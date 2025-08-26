<script setup lang="ts">
import { RadioGroup } from "~/components/ui/radio-group";
import RadioCard from "~/components/base/RadioCard.vue";
import BirdIdentifyInline from "~/components/BirdIdentifyInline.vue";
import { Badge } from "~/components/ui/badge";
import { SPECIES_OPTIONS } from "./constants";
import { toast } from "vue-sonner";

interface Props {
  modelValue: "barn" | "little";
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: Props["modelValue"]): void;
}>();

// Bird identification state
const identifiedSpecies = ref<{
  species: "barn" | "little";
  confidence: number;
  source: "audio" | "image";
} | null>(null);

// Comprehensive species mapping for both audio and image APIs
const SPECIES_MAPPING = {
  // Audio API format (with common name)
  "Tyto alba_Barn Owl": "barn" as const,
  "Athene noctua_Little Owl": "little" as const,

  // Image API format (scientific name only)
  "Tyto alba": "barn" as const,
  "Athene noctua": "little" as const,
};

// Get display name for species
function getSpeciesDisplayName(label: string): string {
  if (label.includes("_")) {
    // Audio format: "Tyto alba_Barn Owl" -> "Barn Owl"
    const parts = label.split("_");
    return parts[1] || parts[0] || label;
  } else {
    // Image format: "Tyto alba" -> "Barn Owl"
    const mapping: Record<string, string> = {
      "Tyto alba": "Barn Owl",
      "Athene noctua": "Little Owl",
    };
    return mapping[label] || label;
  }
}

// Handle bird identification results
function onBirdIdentified(identifiedBirds: any[], rawResponse: any) {
  // Determine if this is audio or image data
  const isAudioData =
    Array.isArray(identifiedBirds) &&
    identifiedBirds.length > 0 &&
    "segments" in (identifiedBirds[0] || {});

  // For image data, extract predictions from the nested structure
  let birds = identifiedBirds;
  if (!isAudioData && rawResponse?.predictions) {
    // Image API returns: { predictions: [{ topk: [...] }] }
    birds = rawResponse.predictions.flatMap((pred: any) => pred.topk || []);
  }

  if (!birds.length) {
    toast.info("No birds identified", {
      description: "Try a different sample or recording",
    });
    return;
  }

  // Find the highest confidence barn owl or little owl
  const relevantBird = birds.find(
    (bird: any) => bird?.label && bird.label in SPECIES_MAPPING
  );

  if (relevantBird) {
    const speciesValue =
      SPECIES_MAPPING[relevantBird.label as keyof typeof SPECIES_MAPPING];
    const confidence = relevantBird.confidence;
    const confidencePercent = Math.round(confidence * 100);
    const displayName = getSpeciesDisplayName(relevantBird.label);
    const source = isAudioData ? "audio" : "image";

    // Auto-select if confidence is high enough (≥80%)
    if (confidence >= 0.8) {
      emit("update:modelValue", speciesValue);
      identifiedSpecies.value = { species: speciesValue, confidence, source };

      toast.success("Species identified and selected!", {
        description: `${displayName} detected with ${confidencePercent}% confidence`,
      });
    }
    // Show badge if confidence is ≥20% but <80%
    else if (confidence >= 0.2) {
      emit("update:modelValue", speciesValue);
      identifiedSpecies.value = { species: speciesValue, confidence, source };

      toast.info("Species identified with moderate confidence", {
        description: `${displayName} detected with ${confidencePercent}% confidence. Please verify manually.`,
      });
    }
    // Low confidence
    else {
      toast.info("Species identified with low confidence", {
        description: `${displayName} detected with ${confidencePercent}% confidence. Please verify manually.`,
      });
    }
  } else {
    // Other species detected
    const topBird = birds[0];
    if (!topBird || !topBird.label) {
      toast.info("Bird detected but species unclear", {
        description: "The identification was unclear. Please verify manually.",
      });
      return;
    }

    const confidence = Math.round(topBird.confidence * 100);
    const displayName = getSpeciesDisplayName(topBird.label);

    toast.info("Different species detected", {
      description: `${displayName} detected with ${confidence}% confidence`,
    });
  }
}

// Clear identification when manually changing selection
function handleSelectionChange(value: string) {
  const typedValue = value as "barn" | "little";
  // Only clear if the new selection doesn't match the identified species
  if (
    identifiedSpecies.value &&
    identifiedSpecies.value.species !== typedValue
  ) {
    identifiedSpecies.value = null;
  }
  emit("update:modelValue", typedValue);
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-4">
      <h2 class="text-xl font-medium">Species</h2>

      <!-- Bird identification component -->
      <BirdIdentifyInline
        :topK="5"
        :minConf="0.1"
        speciesFilter=""
        @identified="onBirdIdentified"
      />

      <!-- Species selection with identification badges -->
      <RadioGroup
        :model-value="props.modelValue"
        @update:model-value="handleSelectionChange"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div v-for="opt in SPECIES_OPTIONS" :key="opt.value" class="relative">
          <RadioCard
            :value="opt.value"
            :selected="props.modelValue"
            :label="opt.label"
          />

          <!-- Confidence badge for identified species -->
          <div
            v-if="identifiedSpecies && identifiedSpecies.species === opt.value"
            class="absolute -top-2 -right-2"
          >
            <Badge
              variant="secondary"
              class="flex items-center gap-1 bg-green-100 text-green-800 border-green-200"
            >
              <Icon
                :name="
                  identifiedSpecies.source === 'audio'
                    ? 'lucide:volume-2'
                    : 'lucide:camera'
                "
                class="w-3 h-3"
              />
              {{ Math.round(identifiedSpecies.confidence * 100) }}%
            </Badge>
          </div>
        </div>
      </RadioGroup>

      <p class="text-sm text-muted-foreground">
        For help with identification see our
        <NuxtLink to="#" class="text-blue-600 hover:text-blue-800 underline"
          >Identification Guide</NuxtLink
        >
        or use the AI identification tool above.
      </p>
    </div>
  </section>
</template>
