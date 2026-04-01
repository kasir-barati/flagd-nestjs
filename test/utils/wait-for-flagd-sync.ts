import { retryAsync, sleep } from 'nestjs-backend-common';

/**
 * @description Polls the flagd OFREP evaluation endpoint until it resolves a given flag key, or throws after the timeout expires.
 */
export async function waitForFlagdSync(
  ofrepBaseUrl: string,
  flagKey: string,
  timeoutMs = 30_000,
  intervalMs = 1_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const [error, response] = await retryAsync(
      () =>
        fetch(`${ofrepBaseUrl}/ofrep/v1/evaluate/flags/${flagKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        }),
      { retry: 0 },
    );

    if (error) {
      continue;
    }

    if (response.ok) {
      return;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `Timed out waiting for flagd to sync flag "${flagKey}" after ${String(timeoutMs)}ms`,
  );
}
