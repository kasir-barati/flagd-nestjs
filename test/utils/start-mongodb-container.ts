import {
  MongoDBContainer,
  type StartedMongoDBContainer,
} from '@testcontainers/mongodb';
import { StartedNetwork } from 'testcontainers';

import { DatabaseOption } from './shared-interfaces';

export async function startMongoContainer(
  network: StartedNetwork,
): Promise<DatabaseOption> {
  const MONGO_NETWORK_ALIAS = 'mongodb';

  const mongoContainer: StartedMongoDBContainer = await new MongoDBContainer(
    'mongo:7',
  )
    .withNetwork(network)
    .withNetworkAliases(MONGO_NETWORK_ALIAS)
    .start();

  return {
    engine: 'mongodb',
    databaseUrl: `mongodb://${MONGO_NETWORK_ALIAS}:27017/flagd`,
    dbContainer: mongoContainer,
  };
}
