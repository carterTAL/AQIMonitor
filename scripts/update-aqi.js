#!/usr/bin/env node
/**
 * update-aqi.js
 * ----------------------------------------------------------------------------
 * Pulls LIVE (current-observation, NOT forecast) AQI from the AirNow.gov API
 * for every monitored location and writes the result to data/aqi-cache.json.
 *
 * Designed to be run once per hour by a GitHub Action. The website only ever
 * reads the committed cache file, so visitors never hit the AirNow API directly
 * and we never get rate-limited.
 *
 * For each location it tries the PRIMARY zip first; if AirNow returns no live
 * observation it falls back to 1-2 nearby BACKUP monitoring stations.
 *
 * Requires an AirNow API key in the AIRNOW_API_KEY environment variable.
 */

const fs = require("fs");
const path = require("path");
const { LOCATIONS } = require("./locations");

const API_KEY = process.env.AIRNOW_API_KEY;
const DISTANCE = 50; // miles radius AirNow will search around the zip
const OUT_FILE = path.join(__dirname, "..", "data", "aqi-cache.json");
const REQUEST_DELAY_MS = 350; // be gentle with the API between calls

if (!API_KEY) {
  console.error("ERROR: AIRNOW_API_KEY environment variable is not set.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch current observations for a single zip code.
 * Returns an array of observation objects, or throws if the response is not
 * valid JSON (e.g. AirNow served an HTML error/rate-limit page).
 */
async function fetchZip(zip) {
  const url =
    `https://www.airnowapi.org/aq/observation/zipCode/current/` +
    `?format=application/json&zipCode=${encodeURIComponent(zip)}` +
    `&distance=${DISTANCE}&API_KEY=${API_KEY}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TAL-AQI-Monitor/1.0" },
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.includes("json")) {
    throw new Error(
      `AirNow returned non-JSON (status ${res.status}, content-type ${contentType})`
    );
  }
  return JSON.parse(text);
}

/**
 * Reduce a list of AirNow observations (which may include O3, PM2.5, PM10)
 * to a single dominant reading = the parameter with the highest AQI.
 */
function dominant(observations) {
  const valid = (observations || []).filter(
    (o) => typeof o.AQI === "number" && o.AQI >= 0
  );
  if (!valid.length) return null;
  return valid.reduce((a, b) => (b.AQI > a.AQI ? b : a));
}

/**
 * Resolve one location: try primary zip, then each backup in order.
 */
async function resolveLocation(loc) {
  const attempts = [loc.zip, ...(loc.backups || [])];
  let lastError = null;

  for (let i = 0; i < attempts.length; i++) {
    const zip = attempts[i];
    try {
      const obs = await fetchZip(zip);
      const best = dominant(obs);
      if (best) {
        return {
          ...baseRecord(loc),
          aqi: best.AQI,
          category: best.Category ? best.Category.Name : "Unknown",
          parameter: best.ParameterName,
          reportingArea: best.ReportingArea,
          observedDate: best.DateObserved ? best.DateObserved.trim() : null,
          observedHour: best.HourObserved,
          observedTz: best.LocalTimeZone,
          sourceZip: zip,
          usedBackup: i > 0,
          status: "ok",
        };
      }
      // No observation at this zip -> fall through to next backup.
    } catch (err) {
      lastError = err.message;
      // On a hard error also try the next backup zip.
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return {
    ...baseRecord(loc),
    aqi: null,
    category: "No Data",
    parameter: null,
    reportingArea: null,
    sourceZip: null,
    usedBackup: false,
    status: lastError ? "error" : "no-data",
    error: lastError || null,
  };
}

function baseRecord(loc) {
  return {
    division: loc.division,
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
  };
}

async function main() {
  console.log(`Updating AQI for ${LOCATIONS.length} locations...`);
  const locations = [];

  for (const loc of LOCATIONS) {
    const rec = await resolveLocation(loc);
    const tag =
      rec.status === "ok"
        ? `AQI ${rec.aqi} (${rec.category})${rec.usedBackup ? " [backup]" : ""}`
        : rec.status.toUpperCase();
    console.log(`  ${rec.city}, ${rec.state}: ${tag}`);
    locations.push(rec);
    await sleep(REQUEST_DELAY_MS);
  }

  const ok = locations.filter((l) => l.status === "ok").length;

  const payload = {
    updated: new Date().toISOString(),
    source: "AirNow.gov current observation (live)",
    totalLocations: locations.length,
    reporting: ok,
    locations,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`\nCache written: ${ok}/${locations.length} reporting -> ${OUT_FILE}`);
}

// Only run automatically when invoked directly (node scripts/update-aqi.js).
// When required by a test, the helpers are exported instead.
if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}

module.exports = { resolveLocation, dominant, fetchZip };
