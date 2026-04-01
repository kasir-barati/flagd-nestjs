import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { StartedTestContainer } from 'testcontainers';

const LOGS_DIR = join(process.cwd(), 'test', 'logs');

export async function saveContainerLogs(
  suiteName: string,
  containerLabel: string,
  container?: StartedTestContainer,
): Promise<void> {
  if (!container) {
    return;
  }

  try {
    const sanitizedSuite = suiteName.replaceAll(/[^\w-]/g, '_');
    const suiteDir = join(LOGS_DIR, sanitizedSuite);

    mkdirSync(suiteDir, { recursive: true });

    const stream = await container.logs();
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk.toString('utf-8'));
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('error', (err: Error) => {
        reject(err);
      });

      // Safety: if the stream doesn't end in 10 seconds, resolve anyway so the test runner isn't blocked.
      setTimeout(() => {
        resolve();
      }, 10_000);
    });

    const filePath = join(suiteDir, `${containerLabel}.log`);

    writeFileSync(filePath, chunks.join(''), 'utf-8');

    console.log(`Container logs saved to ${filePath}`);
  } catch (error) {
    console.error(
      `Failed to save logs for ${suiteName}/${containerLabel}:`,
      error,
    );
  }
}
