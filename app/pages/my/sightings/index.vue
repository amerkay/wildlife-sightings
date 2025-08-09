<template>
  <Container>
    <div class="mx-auto w-full max-w-4xl space-y-6">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">My Sightings</h1>
          <p class="text-muted-foreground">
            View and manage your owl sighting submissions
          </p>
        </div>
        <Button as-child>
          <NuxtLink to="/my/sightings/new">
            <Plus class="mr-2 h-4 w-4" />
            New Sighting
          </NuxtLink>
        </Button>
      </header>

      <div v-if="pending" class="flex justify-center py-8">
        <div class="text-muted-foreground">Loading your sightings...</div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <div class="text-destructive">Failed to load sightings</div>
        <Button @click="refresh()" variant="outline" class="mt-2">
          Try Again
        </Button>
      </div>

      <div v-else-if="!data || data.length === 0" class="text-center py-12">
        <div class="text-muted-foreground mb-4">
          You haven't submitted any sightings yet
        </div>
        <Button as-child>
          <NuxtLink to="/my/sightings/new">Submit Your First Sighting</NuxtLink>
        </Button>
      </div>

      <div v-else class="grid gap-4">
        <Card v-for="sighting in data" :key="sighting.id" class="p-6">
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Badge :variant="getStatusVariant(sighting.status)">
                  {{ sighting.status }}
                </Badge>
                <Badge variant="outline">
                  {{ sighting.type }}
                </Badge>
              </div>

              <div class="text-sm text-muted-foreground">
                Sighted: {{ formatDate(sighting.sighting_date) }}
              </div>

              <div class="text-sm text-muted-foreground">
                Submitted: {{ formatDate(sighting.created_at) }}
              </div>

              <div
                v-if="
                  sighting.observation_period_from ||
                  sighting.observation_period_to
                "
                class="text-sm text-muted-foreground"
              >
                <strong>Observation Period:</strong>
                <span
                  v-if="
                    sighting.observation_period_from &&
                    sighting.observation_period_to
                  "
                >
                  {{ formatDate(sighting.observation_period_from) }} -
                  {{ formatDate(sighting.observation_period_to) }}
                </span>
                <span v-else-if="sighting.observation_period_from">
                  From {{ formatDate(sighting.observation_period_from) }}
                </span>
                <span v-else-if="sighting.observation_period_to">
                  Until {{ formatDate(sighting.observation_period_to) }}
                </span>
              </div>

              <div v-if="sighting.location_notes" class="text-sm">
                <strong>Location:</strong> {{ sighting.location_notes }}
              </div>

              <div class="text-xs text-muted-foreground">
                ID: {{ sighting.id }}
              </div>
            </div>

            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="viewDetails(sighting)"
              >
                View
              </Button>
              <Button
                v-if="sighting.status === 'pending'"
                variant="outline"
                size="sm"
                @click="editSighting(sighting)"
              >
                Edit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Container>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next";

// Add page middleware for authentication
// definePageMeta({
//   middleware: 'auth'
// })

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const { data, pending, error, refresh } = await useAsyncData(
  "user-sightings",
  async () => {
    if (!user.value) return [];

    const { data, error } = await supabase
      .from("sightings")
      .select("*")
      .eq("user_id", user.value.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sightings:", error);
      throw error;
    }

    return data || [];
  }
);

function getStatusVariant(status: string) {
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
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";

  // Handle both DATE (YYYY-MM-DD) and TIMESTAMP formats
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function viewDetails(sighting: any) {
  // TODO: Navigate to detail view or show modal
  console.log("View sighting:", sighting);
}

function editSighting(sighting: any) {
  // TODO: Navigate to edit form with pre-filled data
  console.log("Edit sighting:", sighting);
}
</script>
