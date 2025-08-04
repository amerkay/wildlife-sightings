import { readFile } from "fs/promises";
import Papa from "papaparse";
import { defineEventHandler } from "h3";

export default defineEventHandler(async () => {
  // Resolve the path to the CSV in assets
  const csvUrl = new URL(
    "../../app/assets/gbif_barn_owl_GB_2022-2025.csv",
    import.meta.url
  );
  const csvContent = await readFile(csvUrl, "utf-8");

  // Parse CSV with header row into array of objects
  const { data } = Papa.parse<{ [key: string]: string }>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  // Select only needed columns and convert to proper types
  const observations = (data as any[]).map((row) => {
    const dt = Date.parse(row.eventDate);
    return {
      lat: parseFloat(row.decimalLatitude),
      lng: parseFloat(row.decimalLongitude),
      occurrenceID: row.occurrenceID,
      eventDate: isNaN(dt) ? null : dt, // Convert to epoch timestamp (milliseconds)
      institutionCode: row.institutionCode,
      basisOfRecord: row.basisOfRecord,
      countryCode: row.countryCode,
      locality: row.locality,
    };
  });

  return observations;
});
