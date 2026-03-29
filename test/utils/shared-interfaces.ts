import { StartedNetwork, StartedTestContainer } from 'testcontainers';

import type { DatabaseEngine } from '../../src/shared';

export interface DatabaseOption {
  engine: DatabaseEngine;
  /** Connection URL the app should use (must use the container's network alias) */
  databaseUrl: string;
  /** The started DB container (stopped during cleanup) */
  dbContainer: StartedTestContainer;
}

export interface AppContainers {
  appContainer: StartedTestContainer;
  dbContainer: StartedTestContainer;
  network: StartedNetwork;
  appBaseUrl: string;
}
