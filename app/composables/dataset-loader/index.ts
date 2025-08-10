import { useGbifBarnOwlDataset } from "./datasets/gbif-barn-owl";
import { usePublicSightingsDataset } from "./datasets/public-sightings";
import { useUserSightingsDataset } from "./datasets/user-sightings";

// Re-exports
export { useGbifBarnOwlDataset } from "./datasets/gbif-barn-owl";
export { usePublicSightingsDataset } from "./datasets/public-sightings";
export { useUserSightingsDataset } from "./datasets/user-sightings";
export { useMapDatasets } from "./use-map-datasets";

// Registry of all available dataset loaders
export const useDatasetLoaders = () => {
  const gbifBarnOwl = useGbifBarnOwlDataset();
  const publicSightings = usePublicSightingsDataset();
  const userSightings = useUserSightingsDataset();

  return {
    allDatasets: [userSightings, publicSightings, gbifBarnOwl],
    availableDatasets: [publicSightings, gbifBarnOwl],
  };
};
