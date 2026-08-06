# TAL Air Quality Monitor

An internal, GitHub Pages–hosted dashboard that shows **live** air quality (AQI)
for every TAL division location, using data from the **AirNow.gov** API.

To avoid API rate limits, the site **never calls AirNow from the browser**.
Instead a GitHub Action runs **once per hour**, fetches current observations,
and commits them to `data/aqi-cache.json`. The static page reads only that
cached file.

## How it works

```
GitHub Action (hourly)  ->  scripts/update-aqi.js  ->  data/aqi-cache.json
                                                              |
                                              index.html reads the cache
```

- **Live data, not forecasts.** Uses AirNow's `observation/zipCode/current`
  endpoint.
- **Backup stations.** Each location has a primary zip plus 1–2 nearby backup
  monitoring stations (see `scripts/locations.js`). If the closest station has
  no live reading, the script automatically falls back to a backup and flags the
  row with a `backup` tag.
- **Dominant pollutant.** When a station reports multiple pollutants (O3, PM2.5,
  PM10) the highest AQI is shown, matching AirNow's overall-AQI convention.
- **Sortable & filterable.** Sort by any column (click a header); filter by
  **state** and **division**, plus a free-text search box.

## One-time setup

1. **Get an AirNow API key** — free at <https://docs.airnowapi.org/account/request/>.
2. **Create the repo** and push these files.
3. **Add the key as a secret:** repo **Settings → Secrets and variables →
   Actions → New repository secret**
   - Name: `AIRNOW_API_KEY`
   - Value: *your key*
4. **Enable Pages:** **Settings → Pages → Build and deployment → Deploy from a
   branch**, select your default branch and `/ (root)`.
5. **Enable the workflow:** go to the **Actions** tab and enable workflows if
   prompted. The included `update-aqi.yml` needs **write** permission — confirm
   **Settings → Actions → General → Workflow permissions → Read and write
   permissions** is selected.
6. **Run it once now:** **Actions → Update AQI cache → Run workflow**. This
   refreshes `data/aqi-cache.json` with real data (the shipped copy is seed data
   so the page renders immediately).

The dashboard is then live at `https://<org-or-user>.github.io/<repo>/`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The dashboard (reads `data/aqi-cache.json`). |
| `scripts/update-aqi.js` | Hourly fetcher with backup-station fallback. |
| `scripts/locations.js` | Master list of locations + backup zips. |
| `data/aqi-cache.json` | The cached AQI data the site displays. |
| `.github/workflows/update-aqi.yml` | Hourly GitHub Action. |

## Editing the location list

Edit `scripts/locations.js`. Each entry:

```js
{ division: "Badger Building Center", city: "Sagle", state: "ID",
  zip: "83860", backups: ["83864", "83814"] }
```

`zip` is the primary station; `backups` are tried in order if the primary
returns no live data.

## Changing the refresh interval

Edit the `cron` line in `.github/workflows/update-aqi.yml`. Default is hourly
(`5 * * * *`). GitHub scheduled actions run on UTC.

## Local test run

```bash
export AIRNOW_API_KEY=your_key_here
node scripts/update-aqi.js      # writes data/aqi-cache.json
```
