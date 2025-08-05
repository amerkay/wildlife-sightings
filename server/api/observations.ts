import { readFile } from "fs/promises";
import Papa from "papaparse";
import { defineEventHandler } from "h3";
import { join } from "path";

export default defineEventHandler(async () => {
  // Use process.cwd() to get the project root and navigate to the CSV file
  const csvPath = join(
    process.cwd(),
    "server",
    "api",
    "gbif_barn_owl_GB-IE_2010-2025.csv"
  );
  const csvContent = await readFile(csvPath, "utf-8");

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
