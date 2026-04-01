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
  /**
   * @description used by the OpenFeature SDK (`FlagdProvider`) for in-process flag evaluation via gRPC streaming
   *
   * @example 8013
   */
  flagdGrpcPort: number;
  /**
   * @description OFREP stands for OpenFeature Remote Evaluation Protocol.
   *
   * Standardized HTTP API specification defined by the [OpenFeature](https://openfeature.dev/) project to evaluate feature flags over HTTP/REST.
   */
  flagdOfrepBaseUrl: string;
}
