const currencyForm = document.getElementById("currency-form");
const amountInput = document.getElementById("amount-input");
const fromSelect = document.getElementById("from-select");
const toSelect = document.getElementById("to-select");
const swapButton = document.getElementById("swap-button");
const currencyResult = document.getElementById("currency-result");
const convertButton = currencyForm.querySelector("button[type='submit']");

let rates = null;
let lastUpdated = "";

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

  const result = convertAmount(amount, from, to);
  const oneUnit = convertAmount(1, from, to);

  const main = document.createElement("p");
  main.className = "big-number";
  main.textContent =
    formatNumber(amount) + " " + from + " = " + formatNumber(result) + " " + to;

  const rateLine = document.createElement("p");
  rateLine.textContent = "1 " + from + " = " + formatNumber(oneUnit) + " " + to;

  const note = document.createElement("p");
  note.textContent = lastUpdated
    ? "Daily rates, last updated " + lastUpdated + ". For information only."
    : "Daily rates. For information only.";

  currencyResult.innerHTML = "";
  currencyResult.append(main, rateLine, note);
}

async function loadRates() {
  convertButton.disabled = true;
  swapButton.disabled = true;
  currencyResult.textContent = "Loading exchange rates...";

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");

    if (!response.ok) {
      throw new Error("The rates service failed (status " + response.status + ").");
    }

    const data = await response.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("The rates service did not return any rates.");
    }

    rates = data.rates;

    if (typeof data.time_last_update_unix === "number") {
      lastUpdated = new Date(data.time_last_update_unix * 1000).toLocaleString();
    } else if (data.time_last_update_utc) {
      lastUpdated = data.time_last_update_utc;
    }

    const codes = Object.keys(rates).sort();
    const defaultFrom = codes.includes("USD") ? "USD" : codes[0];
    const defaultTo = codes.includes("EUR") ? "EUR" : codes[1];

    fillSelect(fromSelect, codes, defaultFrom);
    fillSelect(toSelect, codes, defaultTo);

    convertButton.disabled = false;
    swapButton.disabled = false;
    convert();
  } catch (error) {
    currencyResult.textContent = "Could not load exchange rates: " + error.message;
    console.log("Rates error:", error);
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