import { fetchJson } from "./api.js";
import { loadSetting, saveSetting } from "./storage.js";

const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const weatherResult = document.getElementById("weather-result");
const forecastBox = document.getElementById("forecast");
const unitButton = document.getElementById("unit-button");
const searchButton = weatherForm.querySelector("button");

let currentCity = null;
let currentWeather = null;
let useFahrenheit = loadSetting("useFahrenheit", false) === true;

const WEATHER_CODES = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Rime fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Drizzle", icon: "🌦️" },
  55: { text: "Heavy drizzle", icon: "🌦️" },
  56: { text: "Light freezing drizzle", icon: "🌧️" },
  57: { text: "Freezing drizzle", icon: "🌧️" },
  61: { text: "Light rain", icon: "🌧️" },
  63: { text: "Rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Light freezing rain", icon: "🌧️" },
  67: { text: "Freezing rain", icon: "🌧️" },
  71: { text: "Light snow", icon: "❄️" },
  73: { text: "Snow", icon: "❄️" },
  75: { text: "Heavy snow", icon: "❄️" },
  77: { text: "Snow grains", icon: "❄️" },
  80: { text: "Light rain showers", icon: "🌦️" },
  81: { text: "Rain showers", icon: "🌦️" },
  82: { text: "Violent rain showers", icon: "🌧️" },
  85: { text: "Light snow showers", icon: "🌨️" },
  86: { text: "Heavy snow showers", icon: "🌨️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm with hail", icon: "⛈️" },
  99: { text: "Thunderstorm with heavy hail", icon: "⛈️" },
};

function describeWeather(code) {
  return WEATHER_CODES[code] || { text: "Unknown conditions", icon: "❔" };
}

function formatTemp(celsius) {
  if (useFahrenheit) {
    return Math.round((celsius * 9) / 5 + 32) + "°F";
  }
  return Math.round(celsius) + "°C";
}

function formatDay(dateText, index) {
  if (index === 0) {
    return "Today";
  }
  const date = new Date(dateText + "T00:00:00");
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

async function findCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(name)}`;
  const data = await fetchJson(url);

  if (!data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

async function getWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
    "&forecast_days=5&temperature_unit=celsius&timezone=auto";

  return await fetchJson(url);
}

function makeIcon(conditions) {
  const icon = document.createElement("div");
  icon.className = "big-icon";
  icon.textContent = conditions.icon;
  icon.setAttribute("role", "img");
  icon.setAttribute("aria-label", conditions.text);
  return icon;
}

function addLine(parent, label, value) {
  const line = document.createElement("p");
  line.textContent = label + ": " + value;
  parent.appendChild(line);
}

function renderForecast() {
  const daily = currentWeather.daily;

  forecastBox.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = "5-day forecast";

  const grid = document.createElement("div");
  grid.className = "forecast-grid";

  daily.time.forEach(function (dateText, index) {
    const conditions = describeWeather(daily.weather_code[index]);

    const card = document.createElement("div");
    card.className = "forecast-day";

    const day = document.createElement("strong");
    day.textContent = formatDay(dateText, index);

    const temps = document.createElement("p");
    temps.textContent =
      formatTemp(daily.temperature_2m_max[index]) +
      " / " +
      formatTemp(daily.temperature_2m_min[index]);

    const chance = daily.precipitation_probability_max[index];
    const rain = document.createElement("p");
    rain.textContent =
      typeof chance === "number" ? "Rain: " + chance + "%" : "Rain: not available";

    card.append(day, makeIcon(conditions), temps, rain);
    grid.appendChild(card);
  });

  forecastBox.append(heading, grid);
}

function render() {
  if (currentCity === null || currentWeather === null) {
    return;
  }

  const current = currentWeather.current;
  const units = currentWeather.current_units;
  const conditions = describeWeather(current.weather_code);

  weatherResult.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent =
    currentCity.name + (currentCity.country ? ", " + currentCity.country : "");

  const summary = document.createElement("p");
  summary.textContent = formatTemp(current.temperature_2m) + " · " + conditions.text;

  weatherResult.append(title, makeIcon(conditions), summary);
  addLine(weatherResult, "Feels like", formatTemp(current.apparent_temperature));
  addLine(weatherResult, "Humidity", current.relative_humidity_2m + units.relative_humidity_2m);
  addLine(weatherResult, "Wind", current.wind_speed_10m + " " + units.wind_speed_10m);

  renderForecast();
}

async function searchCity(name) {
  searchButton.disabled = true;
  weatherResult.textContent = "Searching...";
  forecastBox.innerHTML = "";
  currentCity = null;
  currentWeather = null;

  try {
    const city = await findCity(name);

    if (city === null) {
      weatherResult.textContent =
        "No city found called " + name + ". Check the spelling and try again.";
      return;
    }

    currentWeather = await getWeather(city.latitude, city.longitude);
    currentCity = city;
    saveSetting("lastCity", name);
    render();
  } catch (error) {
    weatherResult.textContent = "Something went wrong: " + error.message;
    console.log("Weather error:", error);
  } finally {
    searchButton.disabled = false;
  }
}

function updateUnitButton() {
  unitButton.textContent = useFahrenheit ? "Show °C" : "Show °F";
}

unitButton.addEventListener("click", function () {
  useFahrenheit = !useFahrenheit;
  saveSetting("useFahrenheit", useFahrenheit);
  updateUnitButton();
  render();
});

weatherForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = cityInput.value.trim();
  if (name === "") {
    weatherResult.textContent = "Please type a city name.";
    return;
  }

  searchCity(name);
});

updateUnitButton();

const savedCity = loadSetting("lastCity", "");
if (typeof savedCity === "string" && savedCity !== "") {
  cityInput.value = savedCity;
  searchCity(savedCity);
}