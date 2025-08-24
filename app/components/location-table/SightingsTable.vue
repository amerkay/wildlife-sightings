<script setup lang="ts">
import type { SortingState } from "@tanstack/vue-table";
import {
  createSightingsColumns,
  type TableSighting,
} from "~/components/location-table/sightings-columns";
import { toast } from "vue-sonner";
import DataTableHeader from "./DataTableHeader.vue";
import DataTablePagination from "./DataTablePagination.vue";
import SightingsMap from "./map/SightingsMap.vue";
import SightingDetailsDialog from "./SightingDetailsDialog.vue";
import { useDataTable } from "./composables/useDataTable";
import { useTableMapInteraction } from "~/components/location-table/composables/useTableMapInteraction";

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
  updateAdminNotes,
  setPageIndex,
  setPageSize,
  setSorting,
  setSearchTerm,
  canDeleteSighting,
  canUpdateStatus,
} = useExternalData.value ? props.externalData : internalTableData;

// Initialize table-map interaction
const {
  hoveredSightingId,
  selectedSightingId,
  onTableRowHover,
  onTableRowSelect,
  onMapMarkerHover,
  onMapMarkerClick,
} = useTableMapInteraction();

// Dialog state for sighting details
const isDetailsDialogOpen = ref(false);
const selectedSightingForDetails = ref<TableSighting | null>(null);

// Handle row selection for both map interaction and details dialog
const handleRowSelect = (sightingId: string | null) => {
  onTableRowSelect(sightingId);

  if (sightingId) {
    // Find the full sighting data
    const sighting = data.value.find((s: any) => s.id === sightingId);
    if (sighting) {
      selectedSightingForDetails.value = sighting;
      isDetailsDialogOpen.value = true;
    }
  }
}; // Handle delete with confirmation
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

// Handle admin notes update
const handleAdminNotesUpdate = async (id: string, notes: string) => {
  try {
    await updateAdminNotes(id, notes);
    toast.success("Admin notes updated successfully", {
      description: "The admin notes have been saved.",
    });
  } catch (err) {
    console.error("Failed to update admin notes:", err);
    toast.error("Failed to update admin notes", {
      description: "Could not update the admin notes. Please try again later.",
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
      isAdminMode: props.isAdminMode,
      onAdminNotesUpdate: props.isAdminMode
        ? handleAdminNotesUpdate
        : undefined,
    }
  )
);

// Handle sorting change
const handleSortingChange = (newSorting: SortingState) => {
  setSorting(newSorting);
};

// Setup table composable for pagination controls
// Note: We need to pass the reactive values directly, not wrap them in ref() again
const {
  totalPages,
  canPreviousPage,
  canNextPage,
  previousPage,
  nextPage,
  setPageSize: setPageSizeComposable,
} = useDataTable({
  data: computed(() => data.value),
  columns: columns,
  totalCount: computed(() => totalCount.value),
  pageIndex: computed(() => pagination.value.pageIndex),
  pageSize: computed(() => pagination.value.pageSize),
  sorting: computed(() => sorting.value),
  onPageChange: setPageIndex,
  onPageSizeChange: setPageSize,
  onSortingChange: setSorting,
  loading: computed(() => pending.value),
});

const handlePageSizeChange = (size: number) => {
  setPageSizeComposable(size);
  setPageSize(size);
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
    <div class="w-full space-y-4">
      <!-- Header with Search -->
      <DataTableHeader
        v-if="isAdminMode"
        :search-term="''"
        placeholder="Filter contacts..."
        :show-search="isAdminMode"
        @search-change="handleSearchChange"
      />

      <div class="space-y-4 md:grid md:grid-cols-10 gap-4">
        <!-- Table -->
        <div class="md:col-span-7">
          <DataTable
            :columns="columns"
            :data="data"
            :total-count="totalCount"
            :page-index="pagination.pageIndex"
            :page-size="pagination.pageSize"
            :sorting="sorting"
            :loading="pending"
            :hovered-sighting-id="hoveredSightingId"
            :selected-sighting-id="selectedSightingId"
            @page-change="setPageIndex"
            @page-size-change="setPageSize"
            @sorting-change="handleSortingChange"
            @row-hover="onTableRowHover"
            @row-click="handleRowSelect"
          />
        </div>

        <SightingsMap
          class="col-span-3"
          :data="data"
          :loading="pending"
          height="275px"
          :hovered-sighting-id="hoveredSightingId"
          :selected-sighting-id="selectedSightingId"
          @marker-hover="onMapMarkerHover"
          @marker-click="onMapMarkerClick"
        />
      </div>

      <!-- Pagination -->
      <DataTablePagination
        :page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total-count="totalCount"
        :total-pages="totalPages"
        :can-previous-page="canPreviousPage"
        :can-next-page="canNextPage"
        :loading="pending"
        :result-count="data.length"
        @previous-page="previousPage"
        @next-page="nextPage"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- Sighting Details Dialog -->
    <SightingDetailsDialog
      v-model:open="isDetailsDialogOpen"
      :sighting="selectedSightingForDetails"
    />
  </div>
</template>
