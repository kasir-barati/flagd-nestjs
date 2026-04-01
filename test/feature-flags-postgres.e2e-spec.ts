import { Network } from 'testcontainers';

import {
  type AppContainers,
  startAppContainers,
  startPostgresContainer,
  stopAppContainers,
} from './utils';

describe('Feature Flags E2E (PostgreSQL)', () => {
  let containers: AppContainers;

  beforeAll(async () => {
    const network = await new Network().start();
    const dbOption = await startPostgresContainer(network);
    containers = await startAppContainers(dbOption, network);
  });

  afterAll(async () => {
    await stopAppContainers('feature-flags-postgres', containers);
  });

  describe('POST /feature-flags', () => {
    it('should create a feature flag', async () => {
      const response = await fetch(`${containers?.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'e2e-test-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();

      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('flagKey', 'e2e-test-flag');
      expect(body).toHaveProperty('enabled', true);
    });

    it('should return 409 when creating a flag with a duplicate key', async () => {
      const response = await fetch(`${containers?.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'e2e-test-flag',
          enabled: false,
          variants: {},
          defaultVariant: 'off',
          targeting: {},
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /feature-flags', () => {
    it('should return all feature flags', async () => {
      const response = await fetch(`${containers?.appBaseUrl}/feature-flags`);

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(Array.isArray(body)).toBeTrue();
      expect(body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /feature-flags/:id', () => {
    it('should return a specific feature flag by id', async () => {
      const listResponse = await fetch(
        `${containers?.appBaseUrl}/feature-flags`,
      );
      const flags = await listResponse.json();
      const flagId = flags[0].id as string;

      const response = await fetch(
        `${containers?.appBaseUrl}/feature-flags/${flagId}`,
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toHaveProperty('id', flagId);
    });

    it('should return 404 for non-existent flag', async () => {
      const response = await fetch(
        `${containers?.appBaseUrl}/feature-flags/00000000-0000-0000-0000-000000000000`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /feature-flags/:id', () => {
    it('should update a feature flag', async () => {
      const listResponse = await fetch(
        `${containers?.appBaseUrl}/feature-flags`,
      );
      const flags = await listResponse.json();
      const flagId = flags[0].id as string;

      const response = await fetch(
        `${containers?.appBaseUrl}/feature-flags/${flagId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        },
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toHaveProperty('enabled', false);
    });
  });

  describe('GET /flagd/flags.json (sync endpoint)', () => {
    it('should return valid flagd configuration with existing flags', async () => {
      // Arrange — create a flag first
      await fetch(`${containers?.appBaseUrl}/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: 'sync-test-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
        }),
      });

      const response = await fetch(
        `${containers?.appBaseUrl}/flagd/flags.json`,
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toHaveProperty(
        '$schema',
        'https://flagd.dev/schema/v0/flags.json',
      );
      expect(body).toHaveProperty('flags');
      expect(body.flags).toHaveProperty('sync-test-flag');
      expect(body.flags['sync-test-flag']).toEqual({
        state: 'ENABLED',
        variants: { on: true, off: false },
        defaultVariant: 'off',
      });
    });

    it('should return empty flags object when no flags exist', async () => {
      // Arrange — delete all flags
      const listResponse = await fetch(
        `${containers?.appBaseUrl}/feature-flags`,
      );
      const flags = await listResponse.json();

      for (const flag of flags) {
        await fetch(`${containers?.appBaseUrl}/feature-flags/${flag.id}`, {
          method: 'DELETE',
        });
      }

      const response = await fetch(
        `${containers?.appBaseUrl}/flagd/flags.json`,
      );

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body.flags).toEqual({});
    });
  });

  describe('DELETE /feature-flags/:id', () => {
    it('should delete a feature flag', async () => {
      // Arrange — create a flag to delete
      const createResponse = await fetch(
        `${containers?.appBaseUrl}/feature-flags`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flagKey: 'delete-test-flag',
            enabled: true,
            variants: { on: true },
            defaultVariant: 'on',
            targeting: {},
          }),
        },
      );
      const created = await createResponse.json();

      const response = await fetch(
        `${containers?.appBaseUrl}/feature-flags/${created.id}`,
        {
          method: 'DELETE',
        },
      );

      expect(response.status).toBe(204);
    });

    it('should return 404 when deleting a non-existent flag', async () => {
      const response = await fetch(
        `${containers?.appBaseUrl}/feature-flags/00000000-0000-0000-0000-000000000000`,
        { method: 'DELETE' },
      );

      expect(response.status).toBe(404);
    });
  });
});
