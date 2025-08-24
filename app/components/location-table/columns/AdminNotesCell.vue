<script setup lang="ts">
import { Button } from "~/components/ui/button";
// import AdminNotesDialog from "./AdminNotesDialog.vue";

interface Props {
  sightingId: string;
  notes?: string | null;
  onUpdate: (id: string, notes: string) => Promise<void>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  notes: null,
  disabled: false,
});

const isHovered = ref(false);
const isDialogOpen = ref(false);

const displayNotes = computed(() => {
  return props.notes || "No notes";
});

const handleEdit = () => {
  isDialogOpen.value = true;
};

const handleCellClick = () => {
  isDialogOpen.value = true;
};

const handleUpdate = async (notes: string) => {
  await props.onUpdate(props.sightingId, notes);
  isDialogOpen.value = false;
};
</script>

<template>
  <div
    class="flex items-center justify-between group min-w-[140px] cursor-pointer"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleCellClick"
  >
    <span
      class="text-xs text-muted-foreground flex-1 mr-2"
      :class="{ italic: !notes }"
      :title="notes || 'No notes'"
      style="
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        max-width: 100%;
        min-width: 0;
      "
    >
      {{ displayNotes }}
    </span>

    <Button
      variant="ghost"
      size="sm"
      class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      :class="[isHovered ? 'visible' : 'invisible']"
      :disabled="disabled"
      @click.stop="handleEdit"
    >
      <Icon name="lucide:pencil" class="size-3" />
    </Button>

    <AdminNotesDialog
      v-model:open="isDialogOpen"
      :sighting-id="sightingId"
      :initial-notes="notes || ''"
      :disabled="disabled"
      @update="handleUpdate"
    />
  </div>
</template>
