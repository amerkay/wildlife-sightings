<script setup lang="ts">
import type { ColumnDef, SortingState } from "@tanstack/vue-table";
import { FlexRender } from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useDataTable } from "./composables/useDataTable";

interface Props<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  loading?: boolean;
  hoveredSightingId?: string | null;
  selectedSightingId?: string | null;
}

interface Emits {
  (e: "page-change", pageIndex: number): void;
  (e: "page-size-change", pageSize: number): void;
  (e: "sorting-change", sorting: SortingState): void;
  (e: "row-hover", sightingId: string | null): void;
  (e: "row-click", sightingId: string | null): void;
}

const props = withDefaults(defineProps<Props<any>>(), {
  loading: false,
  hoveredSightingId: null,
  selectedSightingId: null,
});

const emit = defineEmits<Emits>();

// Helper functions
const getSightingId = (row: any): string | null => {
  return row.original?.id || null;
};

const isRowHovered = (row: any): boolean => {
  const sightingId = getSightingId(row);
  return sightingId === props.hoveredSightingId;
};

const isRowSelected = (row: any): boolean => {
  const sightingId = getSightingId(row);
  return sightingId === props.selectedSightingId;
};

const handleRowMouseEnter = (row: any) => {
  const sightingId = getSightingId(row);
  emit("row-hover", sightingId);
};

const handleRowMouseLeave = () => {
  emit("row-hover", null);
};

const handleRowClick = (row: any) => {
  const sightingId = getSightingId(row);
  emit("row-click", sightingId);
};

// Convert props to refs for the composable
const dataRef = ref(props.data);
const columnsRef = ref(props.columns);
const totalCountRef = ref(props.totalCount);
const pageIndexRef = ref(props.pageIndex);
const pageSizeRef = ref(props.pageSize);
const sortingRef = ref(props.sorting);
const loadingRef = ref(props.loading);

// Watch for prop changes
watch(
  () => props.data,
  (newData) => {
    dataRef.value = newData;
  }
);
watch(
  () => props.columns,
  (newColumns) => {
    columnsRef.value = newColumns;
  }
);
watch(
  () => props.totalCount,
  (newCount) => {
    totalCountRef.value = newCount;
  }
);
watch(
  () => props.pageIndex,
  (newIndex) => {
    pageIndexRef.value = newIndex;
  }
);
watch(
  () => props.pageSize,
  (newSize) => {
    pageSizeRef.value = newSize;
  }
);
watch(
  () => props.sorting,
  (newSorting) => {
    sortingRef.value = newSorting;
  }
);
watch(
  () => props.loading,
  (newLoading) => {
    loadingRef.value = newLoading;
  }
);

const { table } = useDataTable({
  data: dataRef,
  columns: columnsRef,
  totalCount: totalCountRef,
  pageIndex: pageIndexRef,
  pageSize: pageSizeRef,
  sorting: sortingRef,
  onPageChange: (index) => emit("page-change", index),
  onPageSizeChange: (size) => emit("page-size-change", size),
  onSortingChange: (sorting) => emit("sorting-change", sorting),
  loading: loadingRef,
});
</script>

<template>
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
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Loading...
            </TableCell>
          </TableRow>
        </template>
        <template v-else-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() && 'selected'"
            :class="[
              'cursor-pointer transition-colors',
              {
                'bg-muted/50 hover:bg-muted': isRowHovered(row),
                'bg-accent': isRowSelected(row),
              },
            ]"
            @mouseenter="handleRowMouseEnter(row)"
            @mouseleave="handleRowMouseLeave"
            @click="handleRowClick(row)"
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
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
