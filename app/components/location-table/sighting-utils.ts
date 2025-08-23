/**
 * Utility functions for sighting data formatting and display
 */

/**
 * Get color for sighting type (for map markers)
 */
export const getMarkerColor = (type: string): string => {
  switch (type) {
    case "live":
      return "#22c55e"; // green-500
    case "site":
      return "#3b82f6"; // blue-500
    case "dead":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

/**
 * Get color for sighting status (legacy - keeping for backwards compatibility)
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "approved":
      return "#22c55e"; // green
    case "pending":
      return "#f59e0b"; // yellow
    case "rejected":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

/**
 * Get display label for sighting type
 */
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case "live":
      return "Live";
    case "site":
      return "Roost/Nest";
    case "dead":
      return "Dead";
    default:
      return type;
  }
};

/**
 * Format sighting date for display
 */
export const formatSightingDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Capitalize first letter of string
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
