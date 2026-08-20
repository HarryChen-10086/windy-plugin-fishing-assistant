# 🎣 Windy Fishing Assistant Plugin

> **Language**: English · [**简体中文**](./README_zh.md)

A Windy plugin for anglers: it calculates the **current and future fishing index** for a
chosen spot and shows the weather & sea conditions anglers care about — pressure trend,
wind, temperature, humidity, waves, sea surface temperature, sunrise/sunset, prime-time
windows and weather alerts.

## Features

- **Fishing Index (0–100)** — weighted from six factors: pressure trend, weather, wind, temperature, time of day, and moon phase
  - Current index (from the forecast segment closest to now)
  - Next-hours hourly index (12 points: 12h at 1-hour steps, 36h at 3-hour steps)
  - Next 5 days daily index (best segment + daily average)
  - Visual per-factor breakdown
  - Safety penalty: the index drops automatically under adverse conditions (heavy rain, thunderstorm, strong wind, big waves, etc.)
- **Adverse-weather banner** — when severe conditions are active, a warning banner at the top lists the conditions and the estimated end time
- **Current conditions** — air temp, feels-like, wind/gust, direction, pressure & trend, relative humidity, cloud cover, precipitation, moon phase, elevation
- **Sunrise/Sunset & Prime Time** — auto-calculates morning (2h before → 1.5h after sunrise) and evening (3h before → 1h after sunset) golden windows with an estimated index
- **Waves & Sea State** (shown near the sea) — significant wave height, direction, period, swell, sea surface temperature, wave power
- **Weather alerts** — CAP alerts active for the spot (type, severity, time range)
- **Quick interactions**:
  - Click the map / drag the marker to change the fishing spot
  - "Locate me" button (GPS)
  - Forecast model switch (ECMWF / GFS / ICON; wave data follows automatically)
  - One-click map layer switching (Wind, Gust, Rain, Temp, Waves, SST)

## Languages

English is the default. The plugin also supports **简体中文**:

- A **🌐** button in the toolbar toggles between English and Chinese.
- If your Windy/browser language is **Simplified Chinese**, the plugin switches to Chinese automatically on open (you can still change it manually).

## Usage

Once opened:
- The **map center** is used as the fishing spot by default, or open it from the map's **right-click context menu** (passes the clicked position).
- Click anywhere on the map to change the spot, or drag the pulsing marker.
- Switch the forecast model at the top, and use "Locate me" for your GPS position.
- Move the Windy time slider to preview the index at other times — index, breakdown, alerts and best-of-day update live (🕐 shows the selected time, "Forecast" badge when not "now").

## Open in Developer Mode(For Developers)

```bash
npm i
npm start
```

Then open <https://www.windy.com/developer-mode> and load the plugin:

```
https://localhost:9999/plugin.js
```

## Project Structure

```
src/
├── pluginConfig.ts      # Plugin configuration (name, title, icon, routing…)
├── plugin.svelte        # Main UI (Svelte component)
├── fishingIndex.ts      # Fishing-index scoring & severe-weather logic
├── i18n.ts              # en/zh translations & language detection
└── types.ts             # Local typings for Windy point-forecast data
```

## Data Sources

Data comes from Windy's point-forecast client API via the `@windy/fetch` module:

| Data | API |
| --- | --- |
| Air point forecast (temp/wind/pressure/precip/weather/moon) | `getPointForecastData(model, {lat, lon, days, step}, include)` |
| Waves / swell / period | `getPointForecastData('ecmwfWaves', …)` |
| Sunrise/sunset, timezone, land/sea | `include.celestial` above |
| Dew point / cloud cover (for relative humidity) | `include.meteogram` above |
| Daily weather summary | `include.summary` above |
| Weather alerts | `getCapAlertsSummary({lat, lon})` |
| Unit conversion | `@windy/metrics` (follows the user's Windy units) |

## Fishing Index Scoring

| Factor | Max | Notes |
| --- | --- | --- |
| Pressure trend | 25 | Smaller pressure change between steps is better; 1008–1022 hPa adds a bonus |
| Weather | 20 | Clear/partly cloudy best; showers/light rain okay; thunderstorms & heavy snow worst |
| Wind | 15 | 1.5–6 m/s ideal; >12 m/s penalized heavily |
| Temperature | 15 | 10–25°C most comfortable; below 0°C or above 35°C penalized |
| Time of day | 15 | Full marks around sunrise/sunset prime windows |
| Moon phase | 10 | Around new moon & full moon generally better |
| Safety penalty | — | −30 thunderstorm · −20 wind/waves · −15 rain/snow · −10 extreme temp · −5 fog |

Levels: **≥80 Excellent · ≥60 Good · ≥40 Fair · ≥25 Poor · <25 Very poor**.

> ⚠️ The index is for reference only — actual fishing also depends on water body, species, season, etc. Always check local conditions.

## Beta & Contribution

> 🧪 This project is currently in **beta**. If you find a bug or have a suggestion, please
> report it via [Issues](https://github.com/HarryChen-10086/windy-plugin-fishing-assistant/issues).
> Contributions are welcome!

- Repository: <https://github.com/HarryChen-10086/windy-plugin-fishing-assistant>

## License

This project is open source under the [MIT License](./LICENSE).

## CHANGELOG

-   1.0.0
    -   Initial release.



