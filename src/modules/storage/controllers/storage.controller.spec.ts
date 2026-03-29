import { StorageService } from '../services';
import { StorageController } from './storage.controller';

describe(StorageController.name, () => {
  let uut: StorageController;
  let service: StorageService;

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
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;
    uut = new StorageController(service);
  });

  describe('findAll', () => {
    it('should delegate to StorageService.findAll', async () => {
      vi.mocked(service.findAll).mockResolvedValue([mockFlag]);

      const result = await uut.findAll();

      expect(result).toEqual([mockFlag]);
      expect(service.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('findById', () => {
    it('should delegate to StorageService.findById', async () => {
      vi.mocked(service.findById).mockResolvedValue(mockFlag);

      const result = await uut.findById('uuid-1');

      expect(result).toEqual(mockFlag);
      expect(service.findById).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('create', () => {
    it('should delegate to StorageService.create', async () => {
      const dto = {
        flagKey: 'flag-1',
        enabled: true,
        variants: { on: true, off: false },
        defaultVariant: 'off',
        targeting: {},
      };
      vi.mocked(service.create).mockResolvedValue(mockFlag);

      const result = await uut.create(dto);

      expect(result).toEqual(mockFlag);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should delegate to StorageService.update', async () => {
      const dto = { enabled: false };
      const updated = { ...mockFlag, enabled: false };
      vi.mocked(service.update).mockResolvedValue(updated);

      const result = await uut.update('uuid-1', dto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('delete', () => {
    it('should delegate to StorageService.delete', async () => {
      vi.mocked(service.delete).mockResolvedValue(undefined);

      await uut.delete('uuid-1');

      expect(service.delete).toHaveBeenCalledWith('uuid-1');
    });
  });
});
