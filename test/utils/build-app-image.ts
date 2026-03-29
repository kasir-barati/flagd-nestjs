import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';

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

export async function startPostgresContainer(
  network: StartedNetwork,
): Promise<DatabaseOption> {
  const PG_NETWORK_ALIAS = 'postgres';

  const pgContainer: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    'postgres:17-alpine',
  )
    .withDatabase('flagd')
    .withUsername('flagd')
    .withPassword('flagd')
    .withNetwork(network)
    .withNetworkAliases(PG_NETWORK_ALIAS)
    .start();

  return {
    engine: 'postgres',
    databaseUrl: `postgres://flagd:flagd@${PG_NETWORK_ALIAS}:5432/flagd`,
    dbContainer: pgContainer,
  };
}

export async function startAppContainers(
  dbOption: DatabaseOption,
  network: StartedNetwork,
): Promise<AppContainers> {
  const appImage = await GenericContainer.fromDockerfile(
    '/home/mjb/projects/smart-novel-wrapper/flagd-nestjs',
  ).build('flagd-nestjs-e2e', { deleteOnExit: true });
  const port = 3000;
  const startedApp = await appImage
    .withExposedPorts(port, 8013, 8016)
    .withNetwork(network)
    .withEnvironment({
      PORT: String(port),
      SWAGGER_PATH: 'api',
      SERVICE_NAME: 'flagd-nestjs-e2e',
      DATABASE_ENGINE: dbOption.engine,
      DATABASE_URL: dbOption.databaseUrl,
      FLAGD_HOST: 'localhost',
      FLAGD_PORT: '8013',
      LOG_MODE: 'PLAIN_TEXT',
      LOG_LEVEL: 'debug',
    })
    .withWaitStrategy(Wait.forHttp('/healthcheck', port).forStatusCode(200))
    .withStartupTimeout(120_000)
    .start();

  const appPort = startedApp.getMappedPort(port);
  const appBaseUrl = `http://${startedApp.getHost()}:${String(appPort)}`;

  return {
    appContainer: startedApp,
    dbContainer: dbOption.dbContainer,
    network,
    appBaseUrl,
  };
}

export async function stopAppContainers(
  containers: AppContainers,
): Promise<void> {
  await containers.appContainer.stop();
  await containers.dbContainer.stop();
  await containers.network.stop();
}
