<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

interface Props {
  open: boolean;
  sightingId: string;
  initialNotes: string;
  disabled?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "update", notes: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

const notes = ref(props.initialNotes);
const isSaving = ref(false);

// Watch for prop changes to update internal state
watch(
  () => props.initialNotes,
  (newNotes) => {
    notes.value = newNotes;
  }
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Reset notes when dialog opens
      notes.value = props.initialNotes;
    }
  }
);

const handleCancel = () => {
  notes.value = props.initialNotes; // Reset to original value
  emit("update:open", false);
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    await emit("update", notes.value);
    // Dialog will be closed by parent component after successful update
  } catch (error) {
    console.error("Failed to update admin notes:", error);
  } finally {
    isSaving.value = false;
  }
};

const remainingChars = computed(() => 700 - notes.value.length);
const isOverLimit = computed(() => notes.value.length > 700);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Edit Admin Notes</DialogTitle>
        <DialogDescription>
          Add internal notes for this sighting. These notes are only visible to
          administrators.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="admin-notes">Admin Notes</Label>
          <Textarea
            id="admin-notes"
            v-model="notes"
            placeholder="Enter admin notes here..."
            class="min-h-[120px]"
            :disabled="disabled || isSaving"
          />
          <div class="text-xs text-muted-foreground text-right">
            <span :class="{ 'text-destructive': isOverLimit }">
              {{ remainingChars }} characters remaining
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="disabled || isSaving"
        >
          Cancel
        </Button>
        <Button
          @click="handleSave"
          :disabled="disabled || isSaving || isOverLimit"
        >
          <span v-if="isSaving">Saving...</span>
          <span v-else>Save Changes</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
