import { ref, readonly, computed } from "vue";

/**
 * Composable for managing table-map interaction state
 */
export const useTableMapInteraction = () => {
  // Track which sighting is currently active (hovered or selected)
  const activeSightingId = ref<string | null>(null);

  // Track if the active state is persistent (from click) or temporary (from hover)
  const isPersistent = ref(false);

  /**
   * Set active sighting temporarily (from hover)
   * This can be overridden by other hover events
   */
  const setActiveTemporary = (sightingId: string | null) => {
    // Only set if no persistent selection, or if clearing
    if (!isPersistent.value || sightingId === null) {
      activeSightingId.value = sightingId;
      if (sightingId === null) {
        isPersistent.value = false;
      }
    }
  };

  /**
   * Set active sighting persistently (from click)
   * This stays until another click or explicit clear
   */
  const setActivePersistent = (sightingId: string | null) => {
    activeSightingId.value = sightingId;
    isPersistent.value = sightingId !== null;
  };

  /**
   * Handle table row hover
   */
  const onTableRowHover = (sightingId: string | null) => {
    setActiveTemporary(sightingId);
  };

  /**
   * Handle table row click/selection
   */
  const onTableRowSelect = (sightingId: string | null) => {
    setActivePersistent(sightingId);
  };

  /**
   * Handle map marker hover
   */
  const onMapMarkerHover = (sightingId: string | null) => {
    setActiveTemporary(sightingId);
  };

  /**
   * Handle map marker click
   */
  const onMapMarkerClick = (sightingId: string | null) => {
    setActivePersistent(sightingId);
  };

  /**
   * Clear all interactions
   */
  const clearInteractions = () => {
    activeSightingId.value = null;
    isPersistent.value = false;
  };

  /**
   * Check if a sighting is currently active
   */
  const isSightingActive = (sightingId: string) => {
    return activeSightingId.value === sightingId;
  };

  /**
   * Check if the current active state is persistent
   */
  const isActivePersistent = () => {
    return isPersistent.value;
  };

  return {
    // State
    activeSightingId: readonly(activeSightingId),
    isPersistent: readonly(isPersistent),

    // Legacy state for backward compatibility
    hoveredSightingId: computed(() =>
      isPersistent.value ? null : activeSightingId.value
    ),
    selectedSightingId: computed(() =>
      isPersistent.value ? activeSightingId.value : null
    ),

    // Actions
    onTableRowHover,
    onTableRowSelect,
    onMapMarkerHover,
    onMapMarkerClick,
    clearInteractions,
    setActiveTemporary,
    setActivePersistent,

    // Helpers
    isSightingActive,
    isActivePersistent,
    // Legacy helpers for backward compatibility
    isSightingHovered: (sightingId: string) =>
      !isPersistent.value && activeSightingId.value === sightingId,
    isSightingSelected: (sightingId: string) =>
      isPersistent.value && activeSightingId.value === sightingId,
  };
};
