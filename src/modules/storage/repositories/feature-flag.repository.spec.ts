import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';

import { FeatureFlagEntity } from '../entities';
import { FeatureFlagRepository } from './feature-flag.repository';

describe(FeatureFlagRepository.name, () => {
  let uut: FeatureFlagRepository;
  let repository: Repository<FeatureFlagEntity>;

  beforeEach(() => {
    repository = {
      find: vi.fn(),
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as any;
    uut = new FeatureFlagRepository(repository, {
      DATABASE_URL: 'postgres://localhost/test',
      DATABASE_ENGINE: 'postgres',
    } as any);
  });

  describe('findAll', () => {
    it('should return all feature flags with normalized ids', async () => {
      const entities = [
        {
          id: 'uuid-1',
          flagKey: 'flag-1',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ];
      vi.mocked(repository.find).mockResolvedValue(entities as any);

      const result = await uut.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'uuid-1');
      expect(result[0]).toHaveProperty('flagKey', 'flag-1');
    });
  });

  describe('findById', () => {
    it('should find by id for SQL databases', async () => {
      const entity = {
        id: 'uuid-1',
        flagKey: 'flag-1',
        enabled: true,
        variants: {},
        defaultVariant: 'off',
        targeting: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(repository.findOneBy).mockResolvedValue(entity as any);

      const result = await uut.findById('uuid-1');

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toHaveProperty('id', 'uuid-1');
    });

    it('should find by _id for MongoDB', async () => {
      const mongoRepo = new FeatureFlagRepository(repository, {
        DATABASE_ENGINE: 'mongodb',
        DATABASE_URL: 'mongodb://localhost/test',
      } as any);
      vi.mocked(repository.findOneBy).mockResolvedValue(null);

      await mongoRepo.findById('aabbccddeeff00112233aabb');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        _id: ObjectId.createFromHexString('aabbccddeeff00112233aabb'),
      });
    });

    it('should return null when entity is not found', async () => {
      vi.mocked(repository.findOneBy).mockResolvedValue(null);

      const result = await uut.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByFlagKey', () => {
    it('should find by flagKey', async () => {
      vi.mocked(repository.findOneBy).mockResolvedValue(null);

      await uut.findByFlagKey('my-flag');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        flagKey: 'my-flag',
      });
    });
  });

  describe('create', () => {
    it('should create and save a feature flag', async () => {
      const input = {
        flagKey: 'new-flag',
        enabled: true,
        variants: { on: true },
        defaultVariant: 'on',
        targeting: {},
      };
      const created = { ...input, id: 'uuid-new' };
      const saved = {
        ...created,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(repository.create).mockReturnValue(created as any);
      vi.mocked(repository.save).mockResolvedValue(saved as any);

      const result = await uut.create(input);

      expect(repository.create).toHaveBeenCalledWith(input);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toHaveProperty('id', 'uuid-new');
      expect(result).toHaveProperty('flagKey', 'new-flag');
    });
  });

  describe('update', () => {
    it('should update an existing feature flag', async () => {
      const existing = {
        id: 'uuid-1',
        flagKey: 'flag-1',
        enabled: false,
        variants: {},
        defaultVariant: 'off',
        targeting: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(repository.findOneBy).mockResolvedValue(existing as any);
      vi.mocked(repository.save).mockResolvedValue({
        ...existing,
        enabled: true,
      } as any);

      const result = await uut.update('uuid-1', { enabled: true });

      expect(result).toHaveProperty('enabled', true);
    });

    it('should return null when entity does not exist', async () => {
      vi.mocked(repository.findOneBy).mockResolvedValue(null);

      const result = await uut.update('non-existent', { enabled: true });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return true when entity is deleted', async () => {
      vi.mocked(repository.delete).mockResolvedValue({ affected: 1 } as any);

      const result = await uut.delete('uuid-1');

      expect(result).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith({ id: 'uuid-1' });
    });

    it('should return false when entity does not exist', async () => {
      vi.mocked(repository.delete).mockResolvedValue({ affected: 0 } as any);

      const result = await uut.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should use _id for MongoDB', async () => {
      const mongoRepo = new FeatureFlagRepository(repository, {
        DATABASE_ENGINE: 'mongodb',
        DATABASE_URL: 'mongodb://localhost/test',
      } as any);
      vi.mocked(repository.delete).mockResolvedValue({ affected: 1 } as any);

      await mongoRepo.delete('aabbccddeeff00112233aabb');

      expect(repository.delete).toHaveBeenCalledWith({
        _id: ObjectId.createFromHexString('aabbccddeeff00112233aabb'),
      });
    });
  });
});
