import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';

import { appConfigs } from '../../../app/configs';
import { transformToId } from '../../../shared';
import { FeatureFlagEntity } from '../entities';
import type {
  ICreateFeatureFlag,
  IFeatureFlag,
  IFeatureFlagRepository,
  IUpdateFeatureFlag,
} from '../interfaces';

@Injectable()
export class FeatureFlagRepository implements IFeatureFlagRepository {
  private readonly isMongo: boolean;

  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly repository: Repository<FeatureFlagEntity>,
    @Inject(appConfigs.KEY)
    appConfig: ConfigType<typeof appConfigs>,
  ) {
    this.isMongo = appConfig.DATABASE_ENGINE === 'mongodb';
  }

  private idWhereClause(id: string): Record<string, unknown> {
    return this.isMongo ? { _id: ObjectId.createFromHexString(id) } : { id };
  }

  async findAll(): Promise<IFeatureFlag[]> {
    const entities = await this.repository.find();

    return entities.map((entity) => this.toFeatureFlag(entity));
  }

  async findById(id: string): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy(this.idWhereClause(id));

    return entity ? this.toFeatureFlag(entity) : null;
  }

  async findByFlagKey(flagKey: string): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy({ flagKey });

    return entity ? this.toFeatureFlag(entity) : null;
  }

  async create(data: ICreateFeatureFlag): Promise<IFeatureFlag> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    return this.toFeatureFlag(saved);
  }

  async update(
    id: string,
    data: IUpdateFeatureFlag,
  ): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy(this.idWhereClause(id));

    if (!entity) {
      return null;
    }

    Object.assign(entity, data);
    const saved = await this.repository.save(entity);

    return this.toFeatureFlag(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(this.idWhereClause(id));

    return (result.affected ?? 0) > 0;
  }

  private toFeatureFlag(entity: FeatureFlagEntity): IFeatureFlag {
    return transformToId({
      ...entity,
      flagKey: entity.flagKey,
      enabled: entity.enabled,
      variants: entity.variants,
      defaultVariant: entity.defaultVariant,
      targeting: entity.targeting,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }) as IFeatureFlag;
  }
}
