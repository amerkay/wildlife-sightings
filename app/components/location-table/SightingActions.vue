<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-vue-next";

interface Props {
  sightingId: string;
  status: string;
  showStatusActions?: boolean;
  showDelete?: boolean;
  disabled?: boolean;
}

interface Emits {
  (e: "delete", id: string): void;
  (e: "approve", id: string): void;
  (e: "reject", id: string): void;
  (e: "pending", id: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  showStatusActions: false,
  showDelete: false,
  disabled: false,
});

const emit = defineEmits<Emits>();

const handleAction = (action: string) => {
  switch (action) {
    case "delete":
      emit("delete", props.sightingId);
      break;
    case "approve":
      emit("approve", props.sightingId);
      break;
    case "reject":
      emit("reject", props.sightingId);
      break;
    case "pending":
      emit("pending", props.sightingId);
      break;
  }
};

const hasActions = computed(() => {
  if (props.showDelete) return true;
  return props.showStatusActions ? true : false;
});
</script>

<template>
  <div v-if="!hasActions" class="w-8" />
  <DropdownMenu v-else>
    <DropdownMenuTrigger as-child @click.stop>
      <Button variant="ghost" class="h-8 w-8 p-0" :disabled="disabled">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <!-- Status actions (admin only) -->
      <template v-if="showStatusActions">
        <DropdownMenuItem
          v-if="status !== 'approved'"
          class="text-green-600 cursor-pointer"
          :disabled="disabled"
          @click="handleAction('approve')"
        >
          <CheckCircle class="mr-2 h-4 w-4" />
          Approve
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="status !== 'rejected'"
          class="text-red-600 cursor-pointer"
          :disabled="disabled"
          @click="handleAction('reject')"
        >
          <XCircle class="mr-2 h-4 w-4" />
          Reject
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="status !== 'pending'"
          class="text-yellow-600 cursor-pointer"
          :disabled="disabled"
          @click="handleAction('pending')"
        >
          <Clock class="mr-2 h-4 w-4" />
          Mark as Pending
        </DropdownMenuItem>
      </template>

      <!-- Separator if both status and delete actions -->
      <div v-if="showStatusActions && showDelete" class="border-t my-1" />

      <!-- Delete action -->
      <DropdownMenuItem
        v-if="showDelete"
        class="text-destructive cursor-pointer"
        :disabled="disabled"
        @click="handleAction('delete')"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
