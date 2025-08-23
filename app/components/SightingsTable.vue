<script setup lang="ts">
import type { SortingState } from "@tanstack/vue-table";
import { createSightingsColumns } from "~/components/sightings-table-columns";
import SightingsDataTable from "~/components/SightingsDataTable.vue";
import { Button } from "~/components/ui/button";
import { toast } from "vue-sonner";
import { Map } from "lucide-vue-next";

interface Props {
  title: string;
  description: string;
  showNewSightingButton?: boolean;
  showViewOnMapButton?: boolean;
  newSightingRoute?: string;
  mapRoute?: string;
  isAdminMode?: boolean;
  externalData?: any; // External data source to share with other components
}

const props = withDefaults(defineProps<Props>(), {
  showNewSightingButton: true,
  showViewOnMapButton: true,
  newSightingRoute: "/my/sightings/new",
  mapRoute: "/public-barn-owl-map",
  isAdminMode: false,
});

// Initialize the table composable or use external data
const useExternalData = computed(() => !!props.externalData);

// Use either external data or create our own table data
const internalTableData = useSightingsData({
  isAdminMode: props.isAdminMode,
  enableSearch: props.isAdminMode, // Enable search for admin mode
});

// Choose the data source
const tableData = computed(() => props.externalData || internalTableData);

// Destructure the data and methods
const {
  data,
  totalCount,
  pagination,
  sorting,
  pending,
  error,
  isDeleting,
  isUpdating,
  deleteSighting,
  updateSightingStatus,
  setPageIndex,
  setPageSize,
  setSorting,
  setSearchTerm,
  canDeleteSighting,
  canUpdateStatus,
} = useExternalData.value ? props.externalData : internalTableData;

// Handle delete with confirmation
const handleDelete = async (id: string) => {
  if (
    confirm(
      "Are you sure you want to delete this sighting? This action cannot be undone."
    )
  ) {
    try {
      await deleteSighting(id);
      toast.success("Sighting deleted successfully", {
        description: "The sighting has been removed from our database.",
      });
    } catch (err) {
      console.error("Failed to delete sighting:", err);
      toast.error("Failed to delete sighting", {
        description:
          "Could not delete the sighting. Please try again later or report the issue.",
      });
    }
  }
};

// Handle status update
const handleStatusUpdate = async (id: string, newStatus: string) => {
  try {
    await updateSightingStatus(id, newStatus);
    toast.success("Status updated successfully", {
      description: `Sighting status changed to ${newStatus}.`,
    });
  } catch (err) {
    console.error("Failed to update status:", err);
    toast.error("Failed to update status", {
      description:
        "Could not update the sighting status. Please try again later.",
    });
  }
};

// Handle search
const handleSearchChange = (searchTerm: string) => {
  setSearchTerm(searchTerm);
};

// Create columns with handlers
const columns = computed(() =>
  createSightingsColumns(
    handleDelete,
    handleStatusUpdate,
    canDeleteSighting,
    canUpdateStatus,
    isDeleting.value || isUpdating.value,
    {
      hideContactColumn: !props.isAdminMode,
      showStatusActions: props.isAdminMode,
    }
  )
);

// Handle sorting change
const handleSortingChange = (newSorting: SortingState) => {
  setSorting(newSorting);
};

// Error handling
if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Failed to load sightings",
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ title }}</h1>
        <p class="text-muted-foreground">{{ description }}</p>
      </div>

      <div class="flex items-center gap-3 mt-4 sm:mt-0">
        <NuxtLink v-if="showViewOnMapButton" :to="mapRoute">
          <Button variant="outline">
            <Map class="mr-2 h-4 w-4" />
            View on Map
          </Button>
        </NuxtLink>
        <NuxtLink v-if="showNewSightingButton" :to="newSightingRoute">
          <Button>New Sighting</Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Table -->
    <SightingsDataTable
      :columns="columns"
      :data="data"
      :total-count="totalCount"
      :page-index="pagination.pageIndex"
      :page-size="pagination.pageSize"
      :sorting="sorting"
      :loading="pending"
      :show-contact-filter="isAdminMode"
      @page-change="setPageIndex"
      @page-size-change="setPageSize"
      @sorting-change="handleSortingChange"
      @search-change="handleSearchChange"
    />
  </div>
</template>
