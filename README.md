# Weather and Currency Dashboard

A small dashboard that shows the weather for any city and converts between more than 160 currencies. It is built with plain HTML, CSS and JavaScript, with no frameworks and no API keys.

**Live demo:** https://ochiengemmanuel5562-create.github.io/weather-currency-dashboard/

## Features

- Search any city for current conditions and a 5-day forecast
- Switch between °C and °F instantly, without a new request
- Convert between 160+ currencies, updating as you type, with a swap button
- Loading, error and "try again" states for every network request
- Remembers your last city, units, currencies and theme
- Exchange rates are cached in the browser, and old rates are shown with a warning if the service is down
- Light and dark themes that follow your system setting
- Responsive layout, keyboard friendly, with labelled controls for screen readers

## Data sources

- Weather and city search: [Open-Meteo](https://open-meteo.com/), free for non-commercial use, data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Exchange rates: [ExchangeRate-API open access](https://www.exchangerate-api.com/docs/free). Rates update once a day, so they are for information only

## Built with

- HTML, CSS (custom properties for theming, grid and flexbox) and JavaScript (ES modules)
- `fetch`, `async`/`await`, `localStorage` and `AbortController`
- Git and GitHub Pages

## Project structure

```
index.html   page structure and the early theme script
style.css    layout and light/dark themes (CSS variables)
script.js    city search, weather and forecast
currency.js  exchange rates and the converter
api.js       fetchJson: one request helper with a timeout and clear errors
storage.js   saving settings and caching data in localStorage
theme.js     the light/dark toggle
```

## Run it locally

1. Clone the repository:
   ```
   git clone https://github.com/ochiengemmanuel5562-create/weather-currency-dashboard.git
   ```
2. Open the folder in VS Code.
3. Install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.

Opening `index.html` by double-clicking will not work, because browsers block JavaScript modules on `file://` addresses.

## How it works

- **Searching for weather takes two requests in a row.** The city name goes to Open-Meteo's geocoding API, which returns coordinates. The coordinates then go to the forecast API.
- **Every request goes through one helper**, `fetchJson`. It adds a 10-second timeout and turns network problems into plain-language messages.
- **Rates are cached with an expiry.** The expiry is at least one hour and at most 24 hours. If the service fails but a saved copy exists, the saved copy is used and clearly labelled.
- **The converter works through USD.** Every rate is per one US dollar, so converting from A to B is `amount / rate[A] * rate[B]`.
- **The page is drawn from state.** Data lives in variables and a `render()` function draws from them, so changing units needs no new request.

## Privacy

The app has no server of its own. Searches go directly from your browser to Open-Meteo, and rate requests go directly to ExchangeRate-API, so those services can see your IP address and the city you type. Your settings are stored only in your own browser, using `localStorage`.

## Known limitations

- City search returns only the best match, so a name shared by several cities may pick an unexpected one
- Exchange rates are daily reference rates, not live trading rates
- Free APIs have usage limits, so heavy use could be rate-limited

## What I learned

Chaining two API calls, handling slow and failed requests, caching with expiry, saving and validating settings, building responsive layouts mobile-first, theming with CSS variables, and splitting code into modules with one job each.

## Ideas for later

- A city picker when several places match
- A chart of exchange-rate history
- Hourly forecast and sunrise/sunset times