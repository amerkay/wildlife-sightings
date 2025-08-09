import type { SavedLayer, MinSavedLayer } from "@kepler.gl/types";

// Base interfaces and types
export interface DatasetPreset {
  id: string;
  label: string;
  kind: string;
  endpoint: string;
  layerConfig: SavedLayer | MinSavedLayer;
}

export interface DatasetLoaderResult {
  preset: DatasetPreset;
  data: any[];
}

export const transformDateField = (item: any): any => ({
  ...item,
  sighting_date: item.sighting_date
    ? new Date(item.sighting_date).toISOString()
    : null,
});
