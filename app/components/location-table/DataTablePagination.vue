<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

interface Props {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  loading?: boolean;
  resultCount: number;
}

interface Emits {
  (e: "previous-page"): void;
  (e: "next-page"): void;
  (e: "page-size-change", size: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const handlePageSizeChange = (newSize: any) => {
  if (newSize) {
    emit("page-size-change", parseInt(newSize.toString()));
  }
};
</script>

<template>
  <div>
    <!-- Pagination Controls -->
    <div class="flex items-center justify-between space-x-2 py-4">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">Rows per page</p>
        <Select
          :model-value="pageSize.toString()"
          @update:model-value="handlePageSizeChange"
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
          Page {{ pageIndex + 1 }} of {{ totalPages }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!canPreviousPage || loading"
            @click="emit('previous-page')"
          >
            <span class="sr-only">Go to previous page</span>
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!canNextPage || loading"
            @click="emit('next-page')"
          >
            <span class="sr-only">Go to next page</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Results count -->
    <div class="text-sm text-muted-foreground">
      Showing {{ resultCount }} of {{ totalCount }} results
    </div>
  </div>
</template>
