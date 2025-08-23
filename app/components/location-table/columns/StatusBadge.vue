<script setup lang="ts">
import { Badge } from "~/components/ui/badge";

interface Props {
  status: string;
}

const props = defineProps<Props>();

const getStatusVariant = (status: string) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
</script>

<template>
  <Badge :variant="getStatusVariant(status)">
    {{ formatStatus(status) }}
  </Badge>
</template>
