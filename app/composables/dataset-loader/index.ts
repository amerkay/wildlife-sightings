import { useGbifBarnOwlDataset } from "./datasets/gbif-barn-owl";
import { usePublicSightingsDataset } from "./datasets/public-sightings";
import { useUserSightingsDataset } from "./datasets/user-sightings";
import { useAdminAllSightingsDataset } from "./datasets/admin-all-sightings";

// Re-exports
export { useGbifBarnOwlDataset } from "./datasets/gbif-barn-owl";
export { usePublicSightingsDataset } from "./datasets/public-sightings";
export { useUserSightingsDataset } from "./datasets/user-sightings";
export { useAdminAllSightingsDataset } from "./datasets/admin-all-sightings";
export { useMapDatasets } from "./use-map-datasets";

// Registry of all available dataset loaders
export const useDatasetLoaders = () => {
  const gbifBarnOwl = useGbifBarnOwlDataset();
  const publicSightings = usePublicSightingsDataset();
  const userSightings = useUserSightingsDataset();
  const adminAllSightings = useAdminAllSightingsDataset();

  return {
    allDatasets: [
      userSightings,
      publicSightings,
      gbifBarnOwl,
      adminAllSightings,
    ],
    availableDatasets: [publicSightings, gbifBarnOwl],
  };
};
