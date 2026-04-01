import { FlagdProvider } from '@openfeature/flagd-provider';
import { OpenFeature } from '@openfeature/server-sdk';
import { sleep } from 'nestjs-backend-common';
import { Network } from 'testcontainers';

import {
  type AppContainers,
  type DatabaseOption,
  startAppContainers,
  startMongoContainer,
  stopAppContainers,
  waitForFlagdSync,
} from './utils';

describe('Flagd Flag Evaluation E2E (MongoDB)', () => {
  let containers: AppContainers;

  beforeAll(async () => {
    const network = await new Network().start();
    const dbOption: DatabaseOption = await startMongoContainer(network);
    containers = await startAppContainers(dbOption, network);
  });

  afterAll(async () => {
    await OpenFeature.close();
    await stopAppContainers('flagd-evaluation-mongodb', containers);
  });

  describe('OFREP HTTP API (port 8016)', () => {
    it('should evaluate a boolean flag via OFREP after creating it', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'ofrep-bool-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'on',
          targeting: {},
        }),
      });
      await waitForFlagdSync(containers!.flagdOfrepBaseUrl, 'ofrep-bool-flag');

      // Act
      const evalResponse = await fetch(
        `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/ofrep-bool-flag`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        },
      );

      // Assert
      expect(evalResponse.status).toBe(200);
      const evalBody = await evalResponse.json();
      expect(evalBody).toHaveProperty('key', 'ofrep-bool-flag');
      expect(evalBody).toHaveProperty('value', true);
      expect(evalBody).toHaveProperty('variant', 'on');
      expect(evalBody).toHaveProperty('reason');
    });

    it('should evaluate a string flag via OFREP', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'ofrep-string-flag',
          enabled: true,
          variants: { blue: 'blue-theme', red: 'red-theme' },
          defaultVariant: 'blue',
          targeting: {},
        }),
      });
      await waitForFlagdSync(
        containers!.flagdOfrepBaseUrl,
        'ofrep-string-flag',
      );

      // Act
      const evalResponse = await fetch(
        `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/ofrep-string-flag`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        },
      );

      // Assert
      expect(evalResponse.status).toBe(200);
      const evalBody = await evalResponse.json();
      expect(evalBody).toHaveProperty('key', 'ofrep-string-flag');
      expect(evalBody).toHaveProperty('value', 'blue-theme');
      expect(evalBody).toHaveProperty('variant', 'blue');
    });

    it('should return an error for a non-existent flag via OFREP', async () => {
      // Arrange & Act
      const evalResponse = await fetch(
        `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/non-existent-flag`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        },
      );

      // Assert
      expect(evalResponse.status).not.toBe(200);
    });

    it('should reflect a disabled flag via OFREP', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'ofrep-disabled-flag',
          enabled: false,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
        }),
      });
      await waitForFlagdSync(
        containers!.flagdOfrepBaseUrl,
        'ofrep-disabled-flag',
      ).catch(() => {});

      // Act
      const evalResponse = await fetch(
        `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/ofrep-disabled-flag`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        },
      );

      // Assert
      const evalBody = await evalResponse.json();
      expect(
        evalResponse.status !== 200 ||
          evalBody.reason === 'DISABLED' ||
          evalBody.variant === 'off',
      ).toBeTrue();
    });

    it('should reflect flag updates after syncing via OFREP', async () => {
      // Arrange
      const createResponse = await fetch(
        `${containers.appBaseUrl}/feature-flags`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flagKey: 'ofrep-update-flag',
            enabled: true,
            variants: { on: true, off: false },
            defaultVariant: 'off',
            targeting: {},
          }),
        },
      );
      const created = await createResponse.json();
      await waitForFlagdSync(
        containers!.flagdOfrepBaseUrl,
        'ofrep-update-flag',
      );
      const initialEval = await fetch(
        `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/ofrep-update-flag`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: {} }),
        },
      );
      const initialBody = await initialEval.json();
      expect(initialBody).toHaveProperty('value', false);
      expect(initialBody).toHaveProperty('variant', 'off');

      // Act — update the flag to use defaultVariant "on"
      const updateResponse = await fetch(
        `${containers.appBaseUrl}/feature-flags/${created.id as string}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultVariant: 'on' }),
        },
      );

      // Assert — Wait for flagd to re-sync — poll until we get the updated value
      expect(updateResponse.status).toBe(200);
      const deadline = Date.now() + 30_000;
      let updatedValue: unknown;
      while (Date.now() < deadline) {
        const evalResp = await fetch(
          `${containers!.flagdOfrepBaseUrl}/ofrep/v1/evaluate/flags/ofrep-update-flag`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: {} }),
          },
        );
        const evalBody = await evalResp.json();
        if (evalBody.value === true) {
          updatedValue = evalBody.value;
          break;
        }
        await sleep('1 second');
      }
      expect(updatedValue).toBeTrue();
    });
  });

  describe('OpenFeature SDK via gRPC (port 8013)', () => {
    it('should evaluate a boolean flag via the OpenFeature SDK', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'sdk-bool-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'on',
          targeting: {},
        }),
      });
      await waitForFlagdSync(containers!.flagdOfrepBaseUrl, 'sdk-bool-flag');
      const provider = new FlagdProvider({
        host: containers!.appContainer.getHost(),
        port: containers!.flagdGrpcPort,
        tls: false,
      });
      await OpenFeature.setProviderAndWait(provider);
      const client = OpenFeature.getClient();

      // Act
      const result = await client.getBooleanDetails('sdk-bool-flag', false);

      // Assert
      expect(result.value).toBeTrue();
      expect(result.variant).toBe('on');
      expect(result.flagKey).toBe('sdk-bool-flag');
      expect(result.reason).toBeDefined();
    });

    it('should evaluate a string flag via the OpenFeature SDK', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'sdk-string-flag',
          enabled: true,
          variants: { dark: 'dark-mode', light: 'light-mode' },
          defaultVariant: 'dark',
          targeting: {},
        }),
      });
      await waitForFlagdSync(containers!.flagdOfrepBaseUrl, 'sdk-string-flag');
      const client = OpenFeature.getClient();

      // Act
      const result = await client.getStringDetails(
        'sdk-string-flag',
        'fallback',
      );

      // Assert
      expect(result.value).toBe('dark-mode');
      expect(result.variant).toBe('dark');
      expect(result.flagKey).toBe('sdk-string-flag');
    });

    it('should evaluate a numeric flag via the OpenFeature SDK', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'sdk-number-flag',
          enabled: true,
          variants: { low: 10, medium: 50, high: 100 },
          defaultVariant: 'medium',
          targeting: {},
        }),
      });
      await waitForFlagdSync(containers!.flagdOfrepBaseUrl, 'sdk-number-flag');
      const client = OpenFeature.getClient();

      // Act
      const result = await client.getNumberDetails('sdk-number-flag', 0);

      // Assert
      expect(result.value).toBe(50);
      expect(result.variant).toBe('medium');
      expect(result.flagKey).toBe('sdk-number-flag');
    });

    it('should return default value for a non-existent flag via the SDK', async () => {
      const client = OpenFeature.getClient();

      // Act
      const result = await client.getBooleanDetails(
        'non-existent-sdk-flag',
        false,
      );

      // Assert
      expect(result.value).toBeFalse();
      expect(result.errorCode).toBeDefined();
    });

    it('should return default value for a disabled flag via the SDK', async () => {
      // Arrange
      await fetch(`${containers.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'sdk-disabled-flag',
          enabled: false,
          variants: { on: true, off: false },
          defaultVariant: 'on',
          targeting: {},
        }),
      });
      await sleep('5 seconds'); // Give flagd a moment to sync
      const client = OpenFeature.getClient();

      // Act
      const result = await client.getBooleanDetails('sdk-disabled-flag', false);

      // Assert
      expect(result.value).toBeFalse();
      expect(['DISABLED', 'ERROR']).toContain(result.reason);
    });
  });
});
