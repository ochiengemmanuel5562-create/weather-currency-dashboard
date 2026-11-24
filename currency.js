import { fetchJson } from "./api.js";
import { loadSetting, saveSetting, readCache, writeCache } from "./storage.js";

const currencyForm = document.getElementById("currency-form");
const amountInput = document.getElementById("amount-input");
const fromSelect = document.getElementById("from-select");
const toSelect = document.getElementById("to-select");
const swapButton = document.getElementById("swap-button");
const currencyResult = document.getElementById("currency-result");
const convertButton = currencyForm.querySelector("button[type='submit']");

const RATES_KEY = "rates";
const HOUR = 60 * 60 * 1000;

let rates = null;
let lastUpdated = "";
let usingStaleRates = false;

let currencyNames = null;
try {
  currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
} catch (error) {
  currencyNames = null;
}

function currencyName(code) {
  if (currencyNames === null) {
    return code;
  }
  try {
    return currencyNames.of(code) || code;
  } catch (error) {
    return code;
  }
}

function formatNumber(value) {
  const digits = Math.abs(value) >= 1 ? 2 : 6;
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function convertAmount(amount, from, to) {
  return (amount / rates[from]) * rates[to];
}

function cacheExpiry(data) {
  const now = Date.now();
  const next =
    typeof data.time_next_update_unix === "number"
      ? data.time_next_update_unix * 1000
      : 0;

  return Math.min(Math.max(next, now + HOUR), now + 24 * HOUR);
}

function fillSelect(select, codes, selected) {
  select.innerHTML = "";

  codes.forEach(function (code) {
    const option = document.createElement("option");
    const name = currencyName(code);

    option.value = code;
    option.textContent = name === code ? code : code + " – " + name;
    select.appendChild(option);
  });

  select.value = selected;
}

function convert() {
  if (rates === null) {
    return;
  }

  const amount = amountInput.valueAsNumber;
  if (!Number.isFinite(amount) || amount < 0) {
    currencyResult.textContent = "Enter an amount of 0 or more.";
    return;
  }

  const from = fromSelect.value;
  const to = toSelect.value;

  if (!rates[from] || !rates[to]) {
    currencyResult.textContent = "No rate is available for that pair.";
    return;
  }

  saveSetting("choice", { amount: amount, from: from, to: to });

  const result = convertAmount(amount, from, to);
  const oneUnit = convertAmount(1, from, to);

  const main = document.createElement("p");
  main.className = "big-number";
  main.textContent =
    formatNumber(amount) + " " + from + " = " + formatNumber(result) + " " + to;

  const rateLine = document.createElement("p");
  rateLine.textContent = "1 " + from + " = " + formatNumber(oneUnit) + " " + to;

  const note = document.createElement("p");
  if (usingStaleRates) {
    note.textContent =
      "The rates service could not be reached, so these saved rates may be out of date (last updated " +
      lastUpdated +
      ").";
  } else if (lastUpdated) {
    note.textContent = "Daily rates, last updated " + lastUpdated + ". For information only.";
  } else {
    note.textContent = "Daily rates. For information only.";
  }

  currencyResult.innerHTML = "";
  currencyResult.append(main, rateLine, note);
}

function useRates(newRates, updatedText, isStale) {
  rates = newRates;
  lastUpdated = updatedText;
  usingStaleRates = isStale;

  const codes = Object.keys(rates).sort();
  const saved = loadSetting("choice", {}) || {};

  const defaultFrom = codes.includes("USD") ? "USD" : codes[0];
  const defaultTo = codes.includes("EUR") ? "EUR" : codes[1];

  fillSelect(fromSelect, codes, codes.includes(saved.from) ? saved.from : defaultFrom);
  fillSelect(toSelect, codes, codes.includes(saved.to) ? saved.to : defaultTo);

  if (typeof saved.amount === "number" && saved.amount >= 0) {
    amountInput.value = saved.amount;
  }

  convertButton.disabled = false;
  swapButton.disabled = false;
  convert();
}

function showLoadError(message) {
  currencyResult.innerHTML = "";

  const text = document.createElement("p");
  text.textContent = "Could not load exchange rates: " + message;

  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Try again";
  retry.addEventListener("click", loadRates);

  currencyResult.append(text, retry);
}

async function loadRates() {
  convertButton.disabled = true;
  swapButton.disabled = true;
  currencyResult.textContent = "Loading exchange rates...";

  const cached = readCache(RATES_KEY);
  const haveCache = cached !== null && cached.value && cached.value.rates;

  if (haveCache && !cached.expired) {
    useRates(cached.value.rates, cached.value.lastUpdated, false);
    return;
  }

  try {
    const data = await fetchJson("https://open.er-api.com/v6/latest/USD");

    if (data.result !== "success" || !data.rates) {
      throw new Error("The rates service did not return any rates.");
    }

    let updatedText = "";
    if (typeof data.time_last_update_unix === "number") {
      updatedText = new Date(data.time_last_update_unix * 1000).toLocaleString();
    } else if (data.time_last_update_utc) {
      updatedText = data.time_last_update_utc;
    }

    writeCache(RATES_KEY, { rates: data.rates, lastUpdated: updatedText }, cacheExpiry(data));
    useRates(data.rates, updatedText, false);
  } catch (error) {
    console.log("Rates error:", error);

    if (haveCache) {
      useRates(cached.value.rates, cached.value.lastUpdated, true);
    } else {
      showLoadError(error.message);
    }
  }
}

currencyForm.addEventListener("submit", function (event) {
  event.preventDefault();
  convert();
});

amountInput.addEventListener("input", convert);
fromSelect.addEventListener("change", convert);
toSelect.addEventListener("change", convert);

swapButton.addEventListener("click", function () {
  const oldFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = oldFrom;
  convert();
});

loadRates();