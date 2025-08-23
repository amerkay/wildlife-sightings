import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { ref, computed } from "vue";
import { valueUpdater } from "~/lib/utils";

interface UseDataTableProps<TData> {
  data: Ref<TData[]>;
  columns: Ref<ColumnDef<TData, any>[]>;
  totalCount: Ref<number>;
  pageIndex: Ref<number>;
  pageSize: Ref<number>;
  sorting: Ref<SortingState>;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortingChange: (sorting: SortingState) => void;
  loading?: Ref<boolean>;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  // Local state for client-side filtering
  const columnFilters = ref<ColumnFiltersState>([]);
  const columnVisibility = ref<VisibilityState>({});

  // Computed values for pagination
  const totalPages = computed(() =>
    Math.ceil(props.totalCount.value / props.pageSize.value)
  );
  const canPreviousPage = computed(() => props.pageIndex.value > 0);
  const canNextPage = computed(
    () => props.pageIndex.value < totalPages.value - 1
  );

  // Table configuration
  const table = useVueTable({
    get data() {
      return props.data.value;
    },
    get columns() {
      return props.columns.value;
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, columnFilters),
    onColumnVisibilityChange: (updaterOrValue) =>
      valueUpdater(updaterOrValue, columnVisibility),
    state: {
      get columnFilters() {
        return columnFilters.value;
      },
      get columnVisibility() {
        return columnVisibility.value;
      },
      get sorting() {
        return props.sorting.value;
      },
      pagination: {
        pageIndex: props.pageIndex.value,
        pageSize: props.pageSize.value,
      },
    },
    // Handle server-side sorting
    onSortingChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        props.onSortingChange(updaterOrValue(props.sorting.value));
      } else {
        props.onSortingChange(updaterOrValue);
      }
    },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages.value,
  });

  // Pagination handlers
  const previousPage = () => {
    if (canPreviousPage.value) {
      props.onPageChange(props.pageIndex.value - 1);
    }
  };

  const nextPage = () => {
    if (canNextPage.value) {
      props.onPageChange(props.pageIndex.value + 1);
    }
  };

  const setPageSize = (newSize: string | number) => {
    if (newSize) {
      props.onPageSizeChange(parseInt(newSize.toString()));
    }
  };

  return {
    table,
    totalPages,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    setPageSize,
    columnFilters,
    columnVisibility,
  };
}
