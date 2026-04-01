import { GenericContainer, type StartedNetwork, Wait } from 'testcontainers';

import { saveContainerLogs } from './save-container-logs';
import { AppContainers, DatabaseOption } from './shared-interfaces';

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
  const flagdGrpcPort = startedApp.getMappedPort(8013);
  const flagdOfrepPort = startedApp.getMappedPort(8016);
  const flagdOfrepBaseUrl = `http://${startedApp.getHost()}:${String(flagdOfrepPort)}`;

  return {
    appContainer: startedApp,
    dbContainer: dbOption.dbContainer,
    network,
    appBaseUrl,
    flagdGrpcPort,
    flagdOfrepBaseUrl,
  };
}

export async function stopAppContainers(
  suiteName: string,
  containers?: AppContainers,
): Promise<void> {
  await saveContainerLogs(suiteName, 'app', containers?.appContainer);
  await saveContainerLogs(suiteName, 'db', containers?.dbContainer);

  if (containers?.appContainer) {
    await containers.appContainer.stop().catch((err: unknown) => {
      console.error(`Failed to stop app container (${suiteName}):`, err);
    });
  }

  if (containers?.dbContainer) {
    await containers.dbContainer.stop().catch((err: unknown) => {
      console.error(`Failed to stop db container (${suiteName}):`, err);
    });
  }

  if (containers?.network) {
    await containers.network.stop().catch((err: unknown) => {
      console.error(`Failed to stop network (${suiteName}):`, err);
    });
  }
}
