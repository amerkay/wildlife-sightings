import { useGbifBarnOwlDataset } from "./gbif-barn-owl";
import { usePublicSightingsDataset } from "./public-sightings";
import { useUserSightingsDataset } from "./user-sightings";

// Re-exports
export { useGbifBarnOwlDataset } from "./gbif-barn-owl";
export { usePublicSightingsDataset } from "./public-sightings";
export { useUserSightingsDataset } from "./user-sightings";
export { useMapDatasets } from "./use-map-datasets";

// Registry of all available dataset loaders
export const useDatasetLoaders = () => {
  const gbifBarnOwl = useGbifBarnOwlDataset();
  const publicSightings = usePublicSightingsDataset();
  const userSightings = useUserSightingsDataset();

  const availableDatasets = [gbifBarnOwl, publicSightings];

  return {
    gbifBarnOwl,
    publicSightings,
    userSightings,
    availableDatasets,
  };
};
