import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from 'testcontainers';

export interface AppContainers {
  appContainer: StartedTestContainer;
  pgContainer: StartedPostgreSqlContainer;
  network: StartedNetwork;
  appBaseUrl: string;
}

const PG_NETWORK_ALIAS = 'postgres';

/**
 * Builds and starts the application container alongside a PostgreSQL container
 * for E2E testing. Uses the project Dockerfile to stay close to production.
 */
export async function startAppContainers(): Promise<AppContainers> {
  const network = await new Network().start();

  const pgContainer = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('flagd')
    .withUsername('flagd')
    .withPassword('flagd')
    .withNetwork(network)
    .withNetworkAliases(PG_NETWORK_ALIAS)
    .start();

  const appImage = await GenericContainer.fromDockerfile(
    '/home/mjb/projects/smart-novel-wrapper/flagd-nestjs',
  ).build('flagd-nestjs-e2e', { deleteOnExit: false });

  const startedApp = await appImage
    .withExposedPorts(3000, 8013, 8016)
    .withNetwork(network)
    .withEnvironment({
      PORT: '3000',
      SWAGGER_PATH: 'api',
      SERVICE_NAME: 'flagd-nestjs-e2e',
      DATABASE_ENGINE: 'postgres',
      DATABASE_URL: `postgres://flagd:flagd@${PG_NETWORK_ALIAS}:5432/flagd`,
      FLAGD_HOST: 'localhost',
      FLAGD_PORT: '8013',
      LOG_MODE: 'pretty',
      LOG_LEVEL: 'debug',
    })
    .withWaitStrategy(Wait.forLogMessage('NestJS is ready.'))
    .withStartupTimeout(120_000)
    .start();

  const appPort = startedApp.getMappedPort(3000);
  const appBaseUrl = `http://${startedApp.getHost()}:${String(appPort)}`;

  return {
    appContainer: startedApp,
    pgContainer,
    network,
    appBaseUrl,
  };
}

export async function stopAppContainers(
  containers: AppContainers,
): Promise<void> {
  await containers.appContainer.stop();
  await containers.pgContainer.stop();
  await containers.network.stop();
}
