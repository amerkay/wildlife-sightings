import type { ColumnDef } from "@tanstack/vue-table";
import type { Database } from "~/types/database.types";
import { h } from "vue";
import SortableHeader from "~/components/location-table/columns/SortableHeader.vue";
import StatusBadge from "~/components/location-table/columns/StatusBadge.vue";
import ContactInfo from "~/components/location-table/columns/ContactInfo.vue";
import TypeCell from "~/components/location-table/columns/TypeCell.vue";
import SpeciesCell from "~/components/location-table/columns/SpeciesCell.vue";
import DateCell from "~/components/location-table/columns/DateCell.vue";
import SightingActions from "~/components/location-table/SightingActions.vue";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

interface TableSighting
  extends Pick<
    Sighting,
    | "id"
    | "created_at"
    | "updated_at"
    | "status"
    | "type"
    | "species"
    | "sighting_date"
    | "contact_name"
    | "contact_email"
    | "user_id"
  > {
  lat: number;
  lng: number;
}

export const createSightingsColumns = (
  onDelete: (id: string) => Promise<void>,
  onStatusUpdate: (id: string, status: string) => Promise<void>,
  canDelete: (sighting: TableSighting) => boolean,
  canUpdateStatus: (sighting: TableSighting) => boolean,
  isDeleting: boolean,
  options: {
    hideContactColumn?: boolean;
    showStatusActions?: boolean;
  } = {}
): ColumnDef<TableSighting>[] => {
  const baseColumns: ColumnDef<TableSighting>[] = [
    {
      accessorKey: "species",
      header: ({ column }) => {
        return h(SortableHeader, {
          title: "Species",
          isSorted: column.getIsSorted(),
          onToggleSort: () =>
            column.toggleSorting(column.getIsSorted() === "asc"),
        });
      },
      cell: ({ row }) => {
        const species = row.getValue("species") as string;
        return h(SpeciesCell, { species: species || "barn" }); // Default to barn owl for backward compatibility
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return h(SortableHeader, {
          title: "Type",
          isSorted: column.getIsSorted(),
          onToggleSort: () =>
            column.toggleSorting(column.getIsSorted() === "asc"),
        });
      },
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return h(TypeCell, { type });
      },
    },
    {
      accessorKey: "sighting_date",
      header: ({ column }) => {
        return h(SortableHeader, {
          title: "Date",
          isSorted: column.getIsSorted(),
          onToggleSort: () =>
            column.toggleSorting(column.getIsSorted() === "asc"),
        });
      },
      cell: ({ row }) => {
        const date = row.getValue("sighting_date") as string;
        return h(DateCell, { date });
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return h(StatusBadge, { status });
      },
    },
    {
      accessorKey: "contact_name",
      header: "Contact",
      cell: ({ row }) => {
        const name = row.getValue("contact_name") as string;
        const email = row.original.contact_email;
        return h(ContactInfo, { name, email });
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return h(SortableHeader, {
          title: "Created",
          isSorted: column.getIsSorted(),
          onToggleSort: () =>
            column.toggleSorting(column.getIsSorted() === "asc"),
        });
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return h(DateCell, { date, isSmall: true });
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const sighting = row.original;
        const showDelete = canDelete(sighting);
        const showStatusActions =
          canUpdateStatus(sighting) && options.showStatusActions;

        return h(SightingActions, {
          sightingId: sighting.id,
          status: sighting.status || "pending",
          showStatusActions: !!showStatusActions,
          showDelete: !!showDelete,
          disabled: isDeleting,
          onDelete: (id: string) => onDelete(id),
          onApprove: (id: string) => onStatusUpdate(id, "approved"),
          onReject: (id: string) => onStatusUpdate(id, "rejected"),
          onPending: (id: string) => onStatusUpdate(id, "pending"),
        });
      },
    },
  ];

  // Conditionally filter out the contact column
  const visibleColumns = options.hideContactColumn
    ? baseColumns.filter((col) => {
        if ("accessorKey" in col) {
          return col.accessorKey !== "contact_name";
        }
        return true;
      })
    : baseColumns;

  return visibleColumns;
};

export type { TableSighting };
