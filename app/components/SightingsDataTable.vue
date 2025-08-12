<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { computed, ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { valueUpdater } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortingChange: (sorting: SortingState) => void;
  onSearchChange?: (search: string) => void;
  showContactFilter?: boolean;
  loading?: boolean;
}

const props = defineProps<DataTableProps<any, any>>();

// Local state for client-side filtering
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});

// Computed values for pagination
const totalPages = computed(() => Math.ceil(props.totalCount / props.pageSize));
const canPreviousPage = computed(() => props.pageIndex > 0);
const canNextPage = computed(() => props.pageIndex < totalPages.value - 1);

// Table configuration
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
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
      return props.sorting;
    },
    pagination: {
      pageIndex: props.pageIndex,
      pageSize: props.pageSize,
    },
  },
  // Handle server-side sorting
  onSortingChange: (updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      props.onSortingChange(updaterOrValue(props.sorting));
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
    props.onPageChange(props.pageIndex - 1);
  }
};

const nextPage = () => {
  if (canNextPage.value) {
    props.onPageChange(props.pageIndex + 1);
  }
};

const setPageSize = (newSize: any) => {
  if (newSize) {
    props.onPageSizeChange(parseInt(newSize.toString()));
  }
};

// Search functionality
const searchTerm = ref("");
const debouncedSearch = useDebounceFn((value: string) => {
  if (props.onSearchChange) {
    props.onSearchChange(value);
  }
}, 300);

const handleSearchChange = (value: string | number) => {
  const stringValue = value.toString();
  searchTerm.value = stringValue;
  debouncedSearch(stringValue);
};
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Filters -->
    <div v-if="props.showContactFilter" class="flex items-center space-x-2">
      <Input
        placeholder="Filter contacts..."
        :model-value="searchTerm"
        @update:model-value="handleSearchChange"
        class="max-w-sm"
      />
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow>
              <TableCell
                :colspan="props.columns.length"
                class="h-24 text-center"
              >
                Loading...
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell
                :colspan="props.columns.length"
                class="h-24 text-center"
              >
                No sightings found.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between space-x-2 py-4">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">Rows per page</p>
        <Select
          :model-value="props.pageSize.toString()"
          @update:model-value="setPageSize"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center space-x-6 lg:space-x-8">
        <div
          class="flex w-[120px] items-center justify-center text-sm font-medium"
        >
          Page {{ props.pageIndex + 1 }} of {{ totalPages }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!canPreviousPage || loading"
            @click="previousPage"
          >
            <span class="sr-only">Go to previous page</span>
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!canNextPage || loading"
            @click="nextPage"
          >
            <span class="sr-only">Go to next page</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Results count -->
    <div class="text-sm text-muted-foreground">
      Showing {{ props.data.length }} of {{ props.totalCount }} results
    </div>
  </div>
</template>
