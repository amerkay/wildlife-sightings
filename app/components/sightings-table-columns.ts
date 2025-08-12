import type { ColumnDef } from "@tanstack/vue-table";
import type { Database } from "~~/types/database.types";
import { h } from "vue";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-vue-next";

type Sighting = Database["public"]["Tables"]["sightings"]["Row"];

interface TableSighting
  extends Pick<
    Sighting,
    | "id"
    | "created_at"
    | "updated_at"
    | "status"
    | "type"
    | "sighting_date"
    | "contact_name"
    | "contact_email"
    | "user_id"
  > {
  lat: number;
  lng: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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

const getTypeLabel = (type: string) => {
  switch (type) {
    case "live":
      return "Live Sighting";
    case "site":
      return "Site/Roost/Nest";
    case "dead":
      return "Dead Sighting";
    default:
      return type;
  }
};

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
      accessorKey: "type",
      header: ({ column }) => {
        return h(
          Button,
          {
            variant: "ghost",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => ["Type", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
        );
      },
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return h("div", { class: "font-medium" }, getTypeLabel(type));
      },
    },
    {
      accessorKey: "sighting_date",
      header: ({ column }) => {
        return h(
          Button,
          {
            variant: "ghost",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => ["Date", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("sighting_date") as string;
        return h("div", formatDate(date));
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return h(
          Badge,
          { variant: getStatusVariant(status) },
          () => status.charAt(0).toUpperCase() + status.slice(1)
        );
      },
    },
    {
      accessorKey: "contact_name",
      header: "Contact",
      cell: ({ row }) => {
        const name = row.getValue("contact_name") as string;
        const email = row.original.contact_email;
        return h("div", { class: "space-y-1" }, [
          h("div", { class: "font-medium" }, name),
          h("div", { class: "text-sm text-muted-foreground" }, email),
        ]);
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return h(
          Button,
          {
            variant: "ghost",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => ["Created", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return h("div", { class: "text-sm" }, formatDate(date));
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

        if (!showDelete && !showStatusActions) {
          return h("div", { class: "w-8" }); // Empty space to maintain alignment
        }

        const menuItems: any[] = [];

        // Status actions (admin only)
        if (showStatusActions) {
          if (sighting.status !== "approved") {
            menuItems.push(
              h(
                DropdownMenuItem,
                {
                  class: "text-green-600 cursor-pointer",
                  disabled: isDeleting,
                  onClick: () => onStatusUpdate(sighting.id, "approved"),
                },
                {
                  default: () => [
                    h(CheckCircle, { class: "mr-2 h-4 w-4" }),
                    "Approve",
                  ],
                }
              )
            );
          }

          if (sighting.status !== "rejected") {
            menuItems.push(
              h(
                DropdownMenuItem,
                {
                  class: "text-red-600 cursor-pointer",
                  disabled: isDeleting,
                  onClick: () => onStatusUpdate(sighting.id, "rejected"),
                },
                {
                  default: () => [
                    h(XCircle, { class: "mr-2 h-4 w-4" }),
                    "Reject",
                  ],
                }
              )
            );
          }

          if (sighting.status !== "pending") {
            menuItems.push(
              h(
                DropdownMenuItem,
                {
                  class: "text-yellow-600 cursor-pointer",
                  disabled: isDeleting,
                  onClick: () => onStatusUpdate(sighting.id, "pending"),
                },
                {
                  default: () => [
                    h(Clock, { class: "mr-2 h-4 w-4" }),
                    "Mark as Pending",
                  ],
                }
              )
            );
          }
        }

        // Delete action
        if (showDelete) {
          if (menuItems.length > 0) {
            menuItems.push(h("div", { class: "border-t my-1" })); // Separator
          }
          menuItems.push(
            h(
              DropdownMenuItem,
              {
                class: "text-destructive cursor-pointer",
                disabled: isDeleting,
                onClick: () => onDelete(sighting.id),
              },
              {
                default: () => [h(Trash2, { class: "mr-2 h-4 w-4" }), "Delete"],
              }
            )
          );
        }

        return h(
          DropdownMenu,
          {},
          {
            default: () => [
              h(
                DropdownMenuTrigger,
                { asChild: true },
                {
                  default: () =>
                    h(
                      Button,
                      {
                        variant: "ghost",
                        class: "h-8 w-8 p-0",
                        disabled: isDeleting,
                      },
                      {
                        default: () => [
                          h("span", { class: "sr-only" }, "Open menu"),
                          h(MoreHorizontal, { class: "h-4 w-4" }),
                        ],
                      }
                    ),
                }
              ),
              h(
                DropdownMenuContent,
                { align: "end" },
                {
                  default: () => menuItems,
                }
              ),
            ],
          }
        );
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
