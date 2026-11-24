# Backend API contract

This folder is a framework-independent contract and starter for a client backend.
Copy this folder as a starting point, then implement persistence with the database
selected for that client.

## Feed endpoints

- `GET /feed` returns the complete feed as JSON.
- `PUT /feed` replaces the saved feed with the submitted JSON. `POST /feed` may be supported as a fallback.
- A successful write must be persisted and visible to a following `GET /feed`.
- Allow CORS from the deployed frontend origin, including JSON `PUT` and `POST` requests.
- The frontend expects the API origin and paths in `template/frontend/config.js`.

The whole feed is replaced on save, so preserve every top-level field and setting. See [feed.example.json](feed.example.json) for the empty payload shape.

## Prayer schedule provider

Prayer times come from a separate provider configured in the frontend. Its URL must be an absolute HTTPS URL and accept `month` and `year` query parameters. Return a JSON object with a `prayerTime` array. Each daily entry must provide:

- `date` as `YYYY-MM-DD` or `D-MMM-YYYY`
- `fajr`, `syuruk`, `dhuhr`, `asr`, `maghrib`, and `isha` as `HH:mm` values
- Optional `hijri` as `YYYY-MM-DD`

Set the college's IANA timezone, prayer endpoint, and display label in `config.js`. If the selected provider uses a different response schema, adapt `fetchPrayerSchedule` and `prayerScheduleForToday` in the frontend.
