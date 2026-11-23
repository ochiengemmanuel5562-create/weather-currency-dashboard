const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const weatherResult = document.getElementById("weather-result");
const searchButton = weatherForm.querySelector("button");

async function findCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("The city search failed (status " + response.status + ").");
  }

  const data = await response.json();

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
    "&timezone=auto";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("The weather service failed (status " + response.status + ").");
  }

  return await response.json();
}

function addLine(parent, label, value) {
  const line = document.createElement("p");
  line.textContent = label + ": " + value;
  parent.appendChild(line);
}

function showWeather(city, weather) {
  const current = weather.current;
  const units = weather.current_units;

  weatherResult.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = city.name + (city.country ? ", " + city.country : "");
  weatherResult.appendChild(title);

  addLine(weatherResult, "Temperature", current.temperature_2m + units.temperature_2m);
  addLine(weatherResult, "Feels like", current.apparent_temperature + units.apparent_temperature);
  addLine(weatherResult, "Humidity", current.relative_humidity_2m + units.relative_humidity_2m);
  addLine(weatherResult, "Wind", current.wind_speed_10m + " " + units.wind_speed_10m);
  addLine(weatherResult, "Local time of reading", current.time.replace("T", " "));
}

weatherForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = cityInput.value.trim();
  if (name === "") {
    weatherResult.textContent = "Please type a city name.";
    return;
  }

  searchButton.disabled = true;
  weatherResult.textContent = "Searching...";

  try {
    const city = await findCity(name);

    if (city === null) {
      weatherResult.textContent =
        "No city found called " + name + ". Check the spelling and try again.";
      return;
    }

    const weather = await getWeather(city.latitude, city.longitude);
    showWeather(city, weather);
  } catch (error) {
    weatherResult.textContent = "Something went wrong: " + error.message;
    console.log("Weather error:", error);
  } finally {
    searchButton.disabled = false;
  }
});