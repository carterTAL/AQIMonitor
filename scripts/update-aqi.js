"use strict";

const fs = require("node:fs");
const path = require("node:path");

const API_KEY = process.env.AIRNOW_API_KEY;
const CACHE_FILE = path.join(process.cwd(), "cache", "aqi-cache.json");
const API_ENDPOINT = "https://www.airnowapi.org/aq/observation/current/zipCode/";

if (!API_KEY) {
  console.error("AIRNOW_API_KEY is missing or empty.");
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
    null
  ],
  [
    "Badger Building Center",
    "Bonners Ferry",
    "ID",
    "83805",
    null
  ],
  [
    "Elma Building Center",
    "Elma",
    "WA",
    "98541",
    null
  ],
  [
    "Beaverhead Building Center",
    "Dillon",
    "MT",
    "59725",
    null
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
    null
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
    null
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
    null
  ],
  [
    "Harbor Rental and Saw",
    "Friday Harbor",
    "WA",
    "98250",
    null
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
    null
  ],
  [
    "Marson and Marson Lumber",
    "Cle Elum",
    "WA",
    "98922",
    null
  ],
  [
    "Marson and Marson Lumber",
    "Ephrata",
    "WA",
    "98823",
    null
  ],
  [
    "Midway Building Supply",
    "Tonasket",
    "WA",
    "98855",
    null
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
    null
  ],
  [
    "Miller's Home Center",
    "La Grande",
    "OR",
    "97850",
    null
  ],
  [
    "Mount Vernon Building Center",
    "Mount Vernon",
    "WA",
    "98273",
    null
  ],
  [
    "TAL Support Center",
    "Vancouver",
    "WA",
    "98684",
    null
  ],
  [
    "Tum-A-Lum Lumber",
    "Hood River",
    "OR",
    "97031",
    null
  ],
  [
    "Tum-A-Lum Lumber",
    "The Dalles",
    "OR",
    "97058",
    null
  ],
  [
    "Tum-A-Lum Lumber",
    "Pendleton",
    "OR",
    "97801",
    null
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

function getSource(item) {
  return item?.ReportingArea ?? item?.reportingArea ??
    item?.ReportingAreaName ?? item?.reportingAreaName ??
    item?.SiteName ?? item?.siteName ?? null;
}

function getAqi(item) {
  for (const value of [item?.AQI, item?.aqi, item?.NowcastAQI, item?.nowcastAQI]) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function getCategory(item) {
  const category = item?.Category ?? item?.category;
  if (category && typeof category === "object") {
    return category.Name ?? category.name ?? null;
  }
  return category ?? item?.CategoryName ?? item?.categoryName ?? null;
}

function readPreviousCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return { locations: [] };
  }
}

function findPrevious(cache, location) {
  return cache.locations?.find(item =>
    item.division === location.division &&
    item.city === location.city &&
    item.state === location.state &&
    String(item.zip) === location.zip
  );
}

function cleanPreview(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

async function fetchLocation(location) {
  const params = new URLSearchParams({
    format: "application/json",
    zipCode: location.zip,
    distance: "50",
    API_KEY
  });

  const url = `${API_ENDPOINT}?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "follow"
  });
  
console.log("Final URL:", response.url);
console.log("Status:", response.status);
console.log("Content-Type:", response.headers.get("content-type"));
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "unknown";

  if (!response.ok) {
    throw new Error(
      `AirNow HTTP ${response.status}; content-type ${contentType}; ` +
      `response: ${cleanPreview(rawText)}`
    );
  }

  let observations;
  try {
    observations = JSON.parse(rawText);
  } catch {
    throw new Error(
      `AirNow returned HTML instead of JSON; status ${response.status}; ` +
      `content-type ${contentType}; response: ${cleanPreview(rawText)}`
    );
  }

  if (!Array.isArray(observations)) {
    throw new Error("AirNow returned JSON, but it was not an observation array.");
  }

  const preferred = normalize(location.preferredReportingArea);
  const preferredMatches = preferred
    ? observations.filter(item => {
        const actual = normalize(getSource(item));
        return actual && (
          actual === preferred ||
          actual.includes(preferred) ||
          preferred.includes(actual)
        );
      })
    : observations;

  const candidates = preferredMatches.length ? preferredMatches : observations;
  const selected = [...candidates].sort(
    (a, b) => (getAqi(b) ?? -1) - (getAqi(a) ?? -1)
  )[0];

  if (!selected) {
    throw new Error("No current observation returned.");
  }

  return {
    ...location,
    aqi: getAqi(selected),
    category: getCategory(selected) || "Observation available",
    pollutant: selected.ParameterName ?? selected.parameterName ?? null,
    reportingArea: getSource(selected) || location.preferredReportingArea,
    observationDate: selected.DateObserved ?? selected.dateObserved ?? null,
    lastUpdated: new Date().toISOString(),
    error: preferred && !preferredMatches.length
      ? "Preferred source not found; nearest ZIP result shown"
      : null
  };
}

async function main() {
  const previousCache = readPreviousCache();
  const results = [];

  for (const location of locations) {
    try {
      const result = await fetchLocation(location);
      results.push(result);
      console.log(`${location.city}, ${location.state}: AQI ${result.aqi ?? "n/a"}`);
    } catch (error) {
      const previous = findPrevious(previousCache, location);
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${location.city}, ${location.state}: ${message}`);

      if (previous) {
        results.push({
          ...previous,
          ...location,
          error: `Update failed; retained previous cache: ${message}`
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
          error: message
        });
      }
    }
  }

  const cache = {
    schemaVersion: 2,
    lastUpdated: new Date().toISOString(),
    reporting: results.filter(item => item.aqi !== null).length,
    elevated: results.filter(item => item.aqi !== null && item.aqi > 100).length,
    status: "Workflow completed",
    locations: results
  };

  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n", "utf8");

  console.log(`Cache written: ${cache.reporting}/${results.length} reporting`);
  if (cache.reporting === 0) {
    console.warn("No live observations returned; diagnostic cache was still written.");
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
