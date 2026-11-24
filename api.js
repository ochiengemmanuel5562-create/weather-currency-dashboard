export async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error("The service replied with status " + response.status + ".");
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request took too long. Check your connection and try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach the service. Check your internet connection.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}