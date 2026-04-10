export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry(task, options = {}) {
  const {
    attempts = 3,
    delayMs = 300,
    backoff = 1.75,
    shouldRetry,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      const retryAllowed =
        attempt < attempts && (typeof shouldRetry !== "function" || shouldRetry(error, attempt));

      if (!retryAllowed) {
        throw error;
      }

      const waitTime = Math.round(delayMs * Math.pow(backoff, attempt - 1));
      await sleep(waitTime);
    }
  }

  throw lastError;
}
