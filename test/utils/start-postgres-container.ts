import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { StartedNetwork } from 'testcontainers';

import { DatabaseOption } from './shared-interfaces';

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
