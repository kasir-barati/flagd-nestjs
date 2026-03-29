import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectIdColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DatabaseEngine } from '../../../shared';

export function IdColumnMixin(databaseEngine: DatabaseEngine) {
  if (databaseEngine === 'mongodb') {
    class MongoId {
      _id!: string;
    }
    ObjectIdColumn()(MongoId.prototype, '_id');

    return MongoId;
  }

  class SqlId {
    id!: string;
  }
  PrimaryGeneratedColumn('uuid')(SqlId.prototype, 'id');

  return SqlId;
}

@Entity('feature_flags')
export class FeatureFlagEntity extends IdColumnMixin(
  process.env.DATABASE_ENGINE,
) {
  id: string; // This will be either 'id' or '_id' based on the database engine

  @Column({ unique: true })
  flagKey!: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ type: 'simple-json' })
  variants!: Record<string, unknown>;

  @Column()
  defaultVariant!: string;

  @Column({ type: 'simple-json' })
  targeting!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
