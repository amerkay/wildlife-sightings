<script setup lang="ts">
import { onMounted, nextTick, watch } from "vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useLeafletMap } from "~/components/location-table/composables/useLeafletMap";
import type { TableSighting } from "./sightings-columns";
import {
  TYPE_OPTIONS,
  SPECIES_OPTIONS,
  LIVE_FREQ,
  LIVE_ACTIVITY,
  DEAD_CAUSE,
  SITE_OBSERVED,
  SITE_TYPES,
  NESTBOX_OPTIONS,
  CONNECTION_OPTIONS,
} from "~/components/form-section/constants";

interface Props {
  open: boolean;
  sighting: TableSighting | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Map setup for location display
const { mapEl, getMap, initializeMap, destroyMap } = useLeafletMap({
  center: [53.4808, -2.2426], // UK center as default
  zoom: 8,
  maxZoom: 18,
  minZoom: 3,
});

let marker: L.Marker | null = null;

// Map management functions
const initializeSightingMap = () => {
  if (!props.sighting?.lat || !props.sighting?.lng) return;

  // Destroy any existing map first
  destroyMap();

  // Add a small delay to ensure DOM is ready and dialog is fully rendered
  setTimeout(() => {
    nextTick(() => {
      initializeMap();
      updateMapLocation();
    });
  }, 100);
};

const updateMapLocation = () => {
  if (!props.sighting?.lat || !props.sighting?.lng) return;

  const map = getMap();
  if (!map) return;

  const lat = props.sighting.lat;
  const lng = props.sighting.lng;

  // Set map view
  map.setView([lat, lng], 7);

  // Remove existing marker
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }

  // Add new marker
  marker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "sighting-marker",
      html: `<div class="w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-md"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
  }).addTo(map);
};

// Utility functions for formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Label lookup functions
const getTypeLabel = (type: string) => {
  const option = TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label.replace(/\s*[🦉🪺⚰️]/g, "") || type;
};

const getSpeciesLabel = (species: string) => {
  const option = SPECIES_OPTIONS.find((opt) => opt.value === species);
  return option?.label || species;
};

const getFrequencyLabel = (frequency: string) => {
  const option = LIVE_FREQ.find((opt) => opt.value === frequency);
  return option?.label || frequency;
};

const getActivityLabel = (activity: string) => {
  const option = LIVE_ACTIVITY.find((opt) => opt.value === activity);
  return option?.label || activity;
};

const getCauseLabel = (cause: string) => {
  const option = DEAD_CAUSE.find((opt) => opt.value === cause);
  return option?.label || cause;
};

const getSiteTypeLabel = (siteType: string) => {
  const option = SITE_TYPES.find((opt) => opt.value === siteType);
  return option?.label || siteType;
};

const getObservedLabels = (observed: string[]) => {
  return observed.map((key) => {
    const option = SITE_OBSERVED.find((opt) => opt.key === key);
    return option?.label || key;
  });
};

const getNestboxLabel = (nestbox: string) => {
  const option = NESTBOX_OPTIONS.find((opt) => opt.value === nestbox);
  return option?.label || nestbox;
};

const getConnectionLabel = (connection: string) => {
  const option = CONNECTION_OPTIONS.find((opt) => opt.value === connection);
  return option?.label || connection;
};

// Computed display values
const displayTitle = computed(() => {
  if (!props.sighting) return "Sighting Details";
  return `${getSpeciesLabel(props.sighting.species)} ${getTypeLabel(
    props.sighting.type
  )}`;
});

// Check if type-specific details are available
const hasLiveDetails = computed(() => {
  if (!props.sighting || props.sighting.type !== "live") return false;
  return !!(
    props.sighting.frequency ||
    props.sighting.activity ||
    props.sighting.observation_period
  );
});

const hasSiteDetails = computed(() => {
  if (!props.sighting || props.sighting.type !== "site") return false;
  return !!(
    (props.sighting.observed && props.sighting.observed.length > 0) ||
    props.sighting.site_type ||
    props.sighting.nestbox ||
    props.sighting.connection ||
    props.sighting.observation_period
  );
});

const hasDeadDetails = computed(() => {
  if (!props.sighting || props.sighting.type !== "dead") return false;
  return !!(props.sighting.cause_of_death || props.sighting.death_details);
});

// Initialize map when dialog opens and destroy when it closes
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.sighting?.lat && props.sighting?.lng) {
      initializeSightingMap();
    } else if (!isOpen) {
      // Clean up when dialog closes
      if (marker) {
        const map = getMap();
        if (map && marker) {
          map.removeLayer(marker);
        }
        marker = null;
      }
      destroyMap();
    }
  }
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="sm:max-w-[600px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]"
    >
      <DialogHeader class="p-6 pb-4">
        <DialogTitle>{{ displayTitle }}</DialogTitle>
        <DialogDescription>
          Detailed information about this sighting
        </DialogDescription>
      </DialogHeader>

      <div v-if="sighting" class="px-6 overflow-y-auto">
        <div class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Basic Information
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <div class="text-sm text-muted-foreground">Species</div>
                <div class="font-medium">
                  {{ getSpeciesLabel(sighting.species) }}
                </div>
              </div>
              <div>
                <div class="text-sm text-muted-foreground">Type</div>
                <div class="font-medium">{{ getTypeLabel(sighting.type) }}</div>
              </div>
              <div>
                <div class="text-sm text-muted-foreground">Date</div>
                <div class="font-medium">
                  {{ formatDate(sighting.sighting_date) }}
                </div>
              </div>
              <div>
                <div class="text-sm text-muted-foreground">Status</div>
                <Badge :variant="getStatusVariant(sighting.status)">
                  {{ formatStatus(sighting.status) }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Location Information -->
          <div class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Location
            </h3>
            <div class="space-y-3">
              <!-- Interactive map -->
              <div
                v-if="sighting.lat && sighting.lng"
                class="relative isolate rounded-lg overflow-hidden border"
                style="height: 200px; width: 100%"
              >
                <div ref="mapEl" style="height: 100%; width: 100%" />
                <!-- Coordinates overlay -->
                <div
                  class="absolute bottom-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-mono"
                >
                  {{ sighting.lat.toFixed(6) }}, {{ sighting.lng.toFixed(6) }}
                </div>
              </div>
              <div v-else class="text-sm text-muted-foreground italic">
                Location coordinates not available
              </div>
              <!-- Location notes -->
              <div v-if="sighting.location_notes">
                <div class="text-sm text-muted-foreground">Notes</div>
                <div class="text-sm">{{ sighting.location_notes }}</div>
              </div>
            </div>
          </div>

          <!-- Type-specific Information -->
          <div v-if="sighting.type === 'live'" class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Live Sighting Details
            </h3>
            <div v-if="hasLiveDetails" class="grid gap-3 sm:grid-cols-2">
              <div v-if="sighting.frequency">
                <div class="text-sm text-muted-foreground">Frequency</div>
                <div class="text-sm">
                  {{ getFrequencyLabel(sighting.frequency) }}
                </div>
              </div>
              <div v-if="sighting.activity">
                <div class="text-sm text-muted-foreground">Activity</div>
                <div class="text-sm">
                  {{ getActivityLabel(sighting.activity) }}
                  <span
                    v-if="
                      sighting.activity === 'other' && sighting.activity_other
                    "
                  >
                    - {{ sighting.activity_other }}
                  </span>
                </div>
              </div>
              <div v-if="sighting.observation_period" class="sm:col-span-2">
                <div class="text-sm text-muted-foreground">
                  Observation Period
                </div>
                <div class="text-sm">{{ sighting.observation_period }}</div>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground italic">
              No details available for this sighting.
            </div>
          </div>

          <div v-else-if="sighting.type === 'site'" class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Site Details
            </h3>
            <div v-if="hasSiteDetails" class="space-y-3">
              <div v-if="sighting.observed && sighting.observed.length > 0">
                <div class="text-sm text-muted-foreground">Observed</div>
                <ul class="text-sm space-y-1">
                  <li
                    v-for="label in getObservedLabels(sighting.observed)"
                    :key="label"
                    class="flex items-center gap-2"
                  >
                    <div class="w-1 h-1 bg-current rounded-full"></div>
                    {{ label }}
                  </li>
                </ul>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div v-if="sighting.site_type">
                  <div class="text-sm text-muted-foreground">Site Type</div>
                  <div class="text-sm">
                    {{ getSiteTypeLabel(sighting.site_type) }}
                    <span
                      v-if="
                        sighting.site_type === 'other' &&
                        sighting.site_type_other
                      "
                    >
                      - {{ sighting.site_type_other }}
                    </span>
                  </div>
                </div>
                <div v-if="sighting.nestbox">
                  <div class="text-sm text-muted-foreground">Nestbox</div>
                  <div class="text-sm">
                    {{ getNestboxLabel(sighting.nestbox) }}
                  </div>
                </div>
                <div v-if="sighting.connection">
                  <div class="text-sm text-muted-foreground">Connection</div>
                  <div class="text-sm">
                    {{ getConnectionLabel(sighting.connection) }}
                    <span
                      v-if="
                        sighting.connection === 'other' &&
                        sighting.connection_other
                      "
                    >
                      - {{ sighting.connection_other }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="sighting.observation_period">
                <div class="text-sm text-muted-foreground">
                  Observation Period
                </div>
                <div class="text-sm">{{ sighting.observation_period }}</div>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground italic">
              No details available for this sighting.
            </div>
          </div>

          <div v-else-if="sighting.type === 'dead'" class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Death Details
            </h3>
            <div v-if="hasDeadDetails" class="space-y-3">
              <div v-if="sighting.cause_of_death">
                <div class="text-sm text-muted-foreground">Cause of Death</div>
                <div class="text-sm">
                  {{ getCauseLabel(sighting.cause_of_death) }}
                  <span
                    v-if="
                      sighting.cause_of_death === 'other' &&
                      sighting.cause_of_death_other
                    "
                  >
                    - {{ sighting.cause_of_death_other }}
                  </span>
                </div>
              </div>
              <div v-if="sighting.death_details">
                <div class="text-sm text-muted-foreground">
                  Additional Details
                </div>
                <div class="text-sm">{{ sighting.death_details }}</div>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground italic">
              No details available for this sighting.
            </div>
          </div>

          <!-- Contact Information -->
          <div class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Contact Information
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <div class="text-sm text-muted-foreground">Name</div>
                <div class="text-sm">{{ sighting.contact_name }}</div>
              </div>
              <div>
                <div class="text-sm text-muted-foreground">Email</div>
                <div class="text-sm break-all">
                  {{ sighting.contact_email }}
                </div>
              </div>
              <div v-if="sighting.contact_postcode">
                <div class="text-sm text-muted-foreground">Postcode</div>
                <div class="text-sm">{{ sighting.contact_postcode }}</div>
              </div>
            </div>
          </div>

          <!-- Admin Notes -->
          <div v-if="sighting.admin_notes" class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              Admin Notes
            </h3>
            <div class="text-sm bg-muted/50 rounded-lg p-3">
              {{ sighting.admin_notes }}
            </div>
          </div>

          <!-- Timestamps -->
          <div class="space-y-3">
            <h3
              class="text-sm font-bold text-muted-foreground uppercase tracking-wide"
            >
              System Information
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <div class="text-sm text-muted-foreground">Created</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatDateTime(sighting.created_at) }}
                </div>
              </div>
              <div>
                <div class="text-sm text-muted-foreground">Last Updated</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatDateTime(sighting.updated_at) }}
                </div>
              </div>
              <div v-if="sighting.id" class="sm:col-span-2">
                <div class="text-sm text-muted-foreground">Reference ID</div>
                <div class="text-xs text-muted-foreground font-mono break-all">
                  {{ sighting.id }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="px-6 py-8 text-center text-muted-foreground">
        No sighting data available
      </div>

      <div class="p-6 pt-4 border-t">
        <div class="text-xs text-muted-foreground text-center">
          Click outside or press Escape to close
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Custom marker styles to override Leaflet defaults */
:deep(.sighting-marker) {
  background: transparent !important;
  border: none !important;
}
</style>
