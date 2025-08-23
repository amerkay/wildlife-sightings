import type { Database } from "~~/types/database.types";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

interface SightingsDataOptions {
  pageSize?: number;
  sortBy?: keyof Sighting;
  sortOrder?: "asc" | "desc";
  enableSearch?: boolean;
  isAdminMode?: boolean;
}

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

interface SortingState {
  id: string;
  desc: boolean;
}

export const useSightingsData = (options: SightingsDataOptions = {}) => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const { data: userRole } = useUserRole();

  // Reactive state
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: options.pageSize || 5,
  });

  const sorting = ref<SortingState[]>([
    {
      id: options.sortBy || "created_at",
      desc: options.sortOrder === "desc" ? true : options.sortBy ? false : true,
    },
  ]);

  const searchTerm = ref("");

  // Computed values
  const offset = computed(
    () => pagination.value.pageIndex * pagination.value.pageSize
  );
  const sortConfig = computed(() => {
    const sort = sorting.value[0];
    if (!sort) return { column: "created_at", ascending: false };
    return {
      column: sort.id,
      ascending: !sort.desc,
    };
  });

  // Data fetching function
  const loadSightings = async () => {
    if (!user.value) return { data: [], count: 0 };

    // Admin mode requires admin role
    if (options.isAdminMode && userRole.value !== "admin") {
      throw new Error("Access denied: Admin role required");
    }

    let query = supabase.from("sightings").select(
      `
        id,
        created_at,
        updated_at,
        status,
        type,
        species,
        sighting_date,
        contact_name,
        contact_email,
        lat,
        lng,
        user_id
        `,
      { count: "exact" }
    );

    // Only filter by user_id if not in admin mode
    if (!options.isAdminMode) {
      query = query.eq("user_id", user.value.id);
    }

    // Add search filter if search term exists
    if (searchTerm.value.trim()) {
      query = query.or(
        `contact_name.ilike.%${searchTerm.value}%,contact_email.ilike.%${searchTerm.value}%`
      );
    }

    query = query
      .order(sortConfig.value.column, { ascending: sortConfig.value.ascending })
      .range(offset.value, offset.value + pagination.value.pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching sightings:", error);
      throw error;
    }

    return {
      data: data || [],
      count: count || 0,
    };
  };

  // Use asyncData for caching and reactivity
  const cacheKey = options.isAdminMode
    ? "admin-sightings-data"
    : "user-sightings-data";

  const {
    data: sightingsData,
    pending,
    error,
    refresh,
  } = useLazyAsyncData(cacheKey, loadSightings, {
    watch: [
      () => pagination.value.pageIndex,
      () => pagination.value.pageSize,
      () => sorting.value,
      () => searchTerm.value,
      user,
    ],
    default: () => ({ data: [], count: 0 }),
  });

  // Helper functions for controls
  const setPageIndex = (index: number) => {
    pagination.value.pageIndex = index;
  };

  const setPageSize = (size: number) => {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0; // Reset to first page
  };

  const setSorting = (newSorting: SortingState[]) => {
    sorting.value = newSorting;
    pagination.value.pageIndex = 0; // Reset to first page when sorting changes
  };

  const setSearchTerm = (term: string) => {
    searchTerm.value = term;
    pagination.value.pageIndex = 0; // Reset to first page when searching
  };

  // Additional state for UI operations
  const isDeleting = ref(false);
  const isUpdating = ref(false);

  // Delete sighting function
  const deleteSighting = async (id: string) => {
    if (!user.value) return;

    isDeleting.value = true;
    try {
      let deleteQuery = supabase.from("sightings").delete().eq("id", id);

      // In admin mode, can delete any sighting
      // In user mode, can only delete own pending sightings
      if (!options.isAdminMode) {
        deleteQuery = deleteQuery
          .eq("user_id", user.value.id)
          .eq("status", "pending");
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      // Refresh the table data
      await refresh();

      console.log("Sighting deleted successfully");
    } catch (err) {
      console.error("Error deleting sighting:", err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  };

  // Update sighting status function (admin only)
  const updateSightingStatus = async (id: string, newStatus: string) => {
    if (!user.value || !options.isAdminMode || userRole.value !== "admin") {
      throw new Error("Access denied: Admin role required");
    }

    isUpdating.value = true;
    try {
      const { error } = await (supabase as any)
        .from("sightings")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Refresh the table data
      await refresh();

      console.log("Status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const canDeleteSighting = (sighting: {
    status: string | null;
    user_id?: string | null;
  }) => {
    if (options.isAdminMode && userRole.value === "admin") {
      return true; // Admins can delete any sighting
    }
    // Users can only delete their own pending sightings
    return sighting.status === "pending" && sighting.user_id === user.value?.id;
  };

  const canUpdateStatus = (sighting: {
    status: string | null;
    user_id?: string | null;
  }): boolean => {
    // Only admins can update status
    return Boolean(options.isAdminMode && userRole.value === "admin");
  };

  return {
    // Data
    data: computed(() => sightingsData.value.data),
    totalCount: computed(() => sightingsData.value.count),

    // State
    pagination: readonly(pagination),
    sorting: computed(() => sorting.value),
    searchTerm: readonly(searchTerm),
    pending,
    error,

    // UI State
    isDeleting: readonly(isDeleting),
    isUpdating: readonly(isUpdating),

    // Actions
    refresh,
    setPageIndex,
    setPageSize,
    setSorting,
    setSearchTerm,
    deleteSighting,
    updateSightingStatus,
    canDeleteSighting,
    canUpdateStatus,

    // For backward compatibility
    loadData: loadSightings,
  };
};
