import { ConflictException, NotFoundException } from '@nestjs/common';

import type { IFeatureFlagRepository } from '../interfaces';
import { StorageService } from './storage.service';

describe(StorageService.name, () => {
  let uut: StorageService;
  let repository: IFeatureFlagRepository;

  const mockFlag = {
    id: 'uuid-1',
    flagKey: 'flag-1',
    enabled: true,
    variants: { on: true, off: false },
    defaultVariant: 'off',
    targeting: {},
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByFlagKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    uut = new StorageService(repository);
  });

  describe('findAll', () => {
    it('should return all flags', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockFlag]);

      const result = await uut.findAll();

      expect(result).toEqual([mockFlag]);
    });
  });

  describe('findById', () => {
    it('should return the flag when found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockFlag);

      const result = await uut.findById('uuid-1');

      expect(result).toEqual(mockFlag);
    });

    it('should throw NotFoundException when not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(uut.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a flag when key does not exist', async () => {
      vi.mocked(repository.findByFlagKey).mockResolvedValue(null);
      vi.mocked(repository.create).mockResolvedValue(mockFlag);

      const result = await uut.create({
        flagKey: 'flag-1',
        enabled: true,
        variants: { on: true, off: false },
        defaultVariant: 'off',
        targeting: {},
      });

      expect(result).toEqual(mockFlag);
    });

    it('should throw ConflictException when key already exists', async () => {
      vi.mocked(repository.findByFlagKey).mockResolvedValue(mockFlag);

      await expect(
        uut.create({
          flagKey: 'flag-1',
          enabled: true,
          variants: {},
          defaultVariant: 'off',
          targeting: {},
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update the flag', async () => {
      const updated = { ...mockFlag, enabled: false };
      vi.mocked(repository.findByFlagKey).mockResolvedValue(null);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await uut.update('uuid-1', { enabled: false });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      vi.mocked(repository.findByFlagKey).mockResolvedValue(null);
      vi.mocked(repository.update).mockResolvedValue(null);

      await expect(
        uut.update('non-existent', { enabled: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when flagKey is taken by another flag', async () => {
      vi.mocked(repository.findByFlagKey).mockResolvedValue({
        ...mockFlag,
        id: 'uuid-other',
      });

      await expect(uut.update('uuid-1', { flagKey: 'flag-1' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the flag', async () => {
      vi.mocked(repository.delete).mockResolvedValue(true);

      await expect(uut.delete('uuid-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      vi.mocked(repository.delete).mockResolvedValue(false);

      await expect(uut.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
