"use strict";

const fs = require("node:fs");
const path = require("node:path");

const API_KEY = process.env.AIRNOW_API_KEY;
const CACHE_PATH = path.join(process.cwd(), "cache", "aqi-cache.json");
const API_URL = "https://www.airnowapi.org/aq/observation/current/zipCode/";

if (!API_KEY) {
  console.error("Missing AIRNOW_API_KEY environment variable.");
  process.exit(1);
}

const locations = [
  [
    "Badger Building Center",
    "Sagle",
    "ID",
    "83860",
    "Sandpoint Reporting Area"
  ],
  [
    "Badger Building Center",
    "Post Falls",
    "ID",
    "83854",
    "Coeur d'Alene Reporting Area"
  ],
  [
    "Badger Building Center",
    "Kalispell",
    "MT",
    "59901",
    ""
  ],
  [
    "Badger Building Center",
    "Bonners Ferry",
    "ID",
    "83805",
    ""
  ],
  [
    "Elma Building Center",
    "Elma",
    "WA",
    "98541",
    ""
  ],
  [
    "Beaverhead Building Center",
    "Dillon",
    "MT",
    "59725",
    ""
  ],
  [
    "Best Built Builders Supply",
    "Orofino",
    "ID",
    "83544",
    "Nez Perce Reservation"
  ],
  [
    "Best Built Builders Supply",
    "Grangeville",
    "ID",
    "83530",
    "Grangeville Reporting Area"
  ],
  [
    "Best Built Builders Supply",
    "Kamiah",
    "ID",
    "83536",
    ""
  ],
  [
    "Best Built Builders Supply",
    "Lewiston",
    "ID",
    "83501",
    "Lewiston Reporting Area"
  ],
  [
    "Browne's Home Center",
    "Friday Harbor",
    "WA",
    "98250",
    ""
  ],
  [
    "Ennis Building Center",
    "Ennis",
    "MT",
    "59729",
    "Bozeman EBAM Monitor"
  ],
  [
    "Gerretsen Building Supply",
    "Roseburg",
    "OR",
    "97470",
    ""
  ],
  [
    "Harbor Rental and Saw",
    "Friday Harbor",
    "WA",
    "98250",
    ""
  ],
  [
    "Lake Chelan Building Supply",
    "Chelan",
    "WA",
    "98816",
    "Chelan Reporting Area"
  ],
  [
    "Lake Chelan Building Supply",
    "Manson",
    "WA",
    "98831",
    "Chelan Reporting Area"
  ],
  [
    "Marson and Marson Lumber",
    "Leavenworth",
    "WA",
    "98826",
    "Leavenworth Reporting Area"
  ],
  [
    "Marson and Marson Lumber",
    "Wenatchee",
    "WA",
    "98801",
    ""
  ],
  [
    "Marson and Marson Lumber",
    "Cle Elum",
    "WA",
    "98922",
    ""
  ],
  [
    "Marson and Marson Lumber",
    "Ephrata",
    "WA",
    "98823",
    ""
  ],
  [
    "Midway Building Supply",
    "Tonasket",
    "WA",
    "98855",
    ""
  ],
  [
    "Midway Building Supply",
    "Republic",
    "WA",
    "99166",
    "Republic Monitor"
  ],
  [
    "Midway Building Supply",
    "Oroville",
    "WA",
    "98844",
    "Tonasket Monitor"
  ],
  [
    "Miller's Home Center",
    "Baker City",
    "OR",
    "97814",
    ""
  ],
  [
    "Miller's Home Center",
    "La Grande",
    "OR",
    "97850",
    ""
  ],
  [
    "Mount Vernon Building Center",
    "Mount Vernon",
    "WA",
    "98273",
    ""
  ],
  [
    "TAL Support Center",
    "Vancouver",
    "WA",
    "98684",
    ""
  ],
  [
    "Tum-A-Lum Lumber",
    "Hood River",
    "OR",
    "97031",
    ""
  ],
  [
    "Tum-A-Lum Lumber",
    "The Dalles",
    "OR",
    "97058",
    ""
  ],
  [
    "Tum-A-Lum Lumber",
    "Pendleton",
    "OR",
    "97801",
    ""
  ]
].map(
  ([division, city, state, zip, preferredReportingArea]) => ({
    division,
    city,
    state,
    zip,
    preferredReportingArea: preferredReportingArea || null
  })
);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/reporting area|monitor/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function numericAqi(item) {
  for (const value of [item?.AQI, item?.aqi, item?.NowcastAQI, item?.nowcastAQI]) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function categoryName(item) {
  const category = item?.Category ?? item?.category;
  if (category && typeof category === "object") return category.Name ?? category.name ?? null;
  return category ?? item?.CategoryName ?? item?.categoryName ?? null;
}

function sourceName(item) {
  return item?.ReportingArea ?? item?.reportingArea ??
    item?.ReportingAreaName ?? item?.reportingAreaName ??
    item?.SiteName ?? item?.siteName ?? null;
}

function readPreviousCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return { locations: [] };
  }
}

function previousFor(cache, location) {
  return cache.locations?.find(item =>
    item.division === location.division &&
    item.city === location.city &&
    item.state === location.state &&
    String(item.zip) === location.zip
  );
}

async function fetchLocation(location) {
  const params = new URLSearchParams({
    format: "application/json",
    zipCode: location.zip,
    distance: "50",
    API_KEY
  });

  const response = await fetch(`${API_URL}?${params}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`AirNow HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json();
  const observations = Array.isArray(data) ? data : [];
  const preferred = normalize(location.preferredReportingArea);
  const preferredMatches = preferred
    ? observations.filter(item => {
        const actual = normalize(sourceName(item));
        return actual && (actual === preferred || actual.includes(preferred) || preferred.includes(actual));
      })
    : observations;

  const candidates = preferredMatches.length ? preferredMatches : observations;
  const selected = [...candidates].sort((a, b) => (numericAqi(b) ?? -1) - (numericAqi(a) ?? -1))[0];
  if (!selected) throw new Error("No current observation returned");

  const now = new Date().toISOString();
  return {
    ...location,
    aqi: numericAqi(selected),
    category: categoryName(selected) || "Observation available",
    pollutant: selected.ParameterName ?? selected.parameterName ?? null,
    reportingArea: sourceName(selected) || location.preferredReportingArea,
    observationDate: selected.DateObserved ?? selected.dateObserved ?? null,
    lastUpdated: now,
    error: preferred && !preferredMatches.length
      ? "Preferred source not found; nearest ZIP result shown"
      : null
  };
}

async function main() {
  const previous = readPreviousCache();
  const results = [];

  // Deliberately sequential to avoid bursting the AirNow service.
  for (const location of locations) {
    try {
      results.push(await fetchLocation(location));
    } catch (error) {
      const old = previousFor(previous, location);
      if (old) {
        results.push({
          ...old,
          ...location,
          error: `Update failed; retained previous cache: ${error.message}`
        });
      } else {
        results.push({
          ...location,
          aqi: null,
          category: "Unavailable",
          pollutant: null,
          reportingArea: location.preferredReportingArea,
          observationDate: null,
          lastUpdated: null,
          error: error.message
        });
      }
    }
  }

  const cache = {
    schemaVersion: 1,
    lastUpdated: new Date().toISOString(),
    reporting: results.filter(item => item.aqi !== null).length,
    elevated: results.filter(item => item.aqi !== null && item.aqi > 100).length,
    locations: results
  };

  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
  console.log(`Wrote ${results.length} locations to ${CACHE_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
