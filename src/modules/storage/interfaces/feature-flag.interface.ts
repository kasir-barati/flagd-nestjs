/**
 * Database-agnostic interface for a feature flag.
 * This is what the repository layer returns — never raw entities.
 */
export interface IFeatureFlag {
  id: string;
  flagKey: string;
  enabled: boolean;
  variants: Record<string, unknown>;
  defaultVariant: string;
  targeting: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new feature flag (no id, no timestamps).
 */
export interface ICreateFeatureFlag {
  flagKey: string;
  enabled: boolean;
  variants: Record<string, unknown>;
  defaultVariant: string;
  targeting: Record<string, unknown>;
}

/**
 * Input for updating an existing feature flag (all fields optional).
 */
export interface IUpdateFeatureFlag {
  flagKey?: string;
  enabled?: boolean;
  variants?: Record<string, unknown>;
  defaultVariant?: string;
  targeting?: Record<string, unknown>;
}

/**
 * Repository interface — database engine agnostic contract.
 */
export interface IFeatureFlagRepository {
  findAll(): Promise<IFeatureFlag[]>;
  findById(id: string): Promise<IFeatureFlag | null>;
  findByFlagKey(flagKey: string): Promise<IFeatureFlag | null>;
  create(data: ICreateFeatureFlag): Promise<IFeatureFlag>;
  update(id: string, data: IUpdateFeatureFlag): Promise<IFeatureFlag | null>;
  delete(id: string): Promise<boolean>;
}

export const FEATURE_FLAG_REPOSITORY = Symbol('FEATURE_FLAG_REPOSITORY');
