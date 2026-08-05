# AQI GitHub Pages package

1. Copy all files and folders into the repository root.
2. In repository Settings > Secrets and variables > Actions, create `AIRNOW_API_KEY`.
3. In Actions, open **Update AQI cache** and select **Run workflow** once.
4. In Settings > Pages, publish from the same branch and repository root.
5. Open the Pages site. The visible status banner reports the exact cache path and load state.

The page reads `cache/aqi-cache.json` relative to its own URL, so it works for both user sites and project sites. Do not open `index.html` with a `file:` URL because browsers do not serve the JSON file as a normal GitHub Pages resource in that mode.
