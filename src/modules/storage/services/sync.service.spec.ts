import type { IFeatureFlagRepository } from '../interfaces';
import { SyncService } from './sync.service';

describe(SyncService.name, () => {
  let uut: SyncService;
  let repository: IFeatureFlagRepository;

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByFlagKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    uut = new SyncService(repository);
  });

  describe('buildFlagConfiguration', () => {
    it('should return empty flags object when no flags exist', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      const result = await uut.buildFlagConfiguration();

      expect(result).toEqual({
        $schema: 'https://flagd.dev/schema/v0/flags.json',
        flags: {},
      });
    });

    it('should transform enabled flags to ENABLED state', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        {
          id: 'uuid-1',
          flagKey: 'dark-mode',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await uut.buildFlagConfiguration();

      expect(result.flags).toEqual({
        'dark-mode': {
          state: 'ENABLED',
          variants: { on: true, off: false },
          defaultVariant: 'off',
        },
      });
    });

    it('should transform disabled flags to DISABLED state', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        {
          id: 'uuid-2',
          flagKey: 'beta-feature',
          enabled: false,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await uut.buildFlagConfiguration();

      expect(result.flags).toHaveProperty('beta-feature');
      expect((result.flags as Record<string, any>)['beta-feature'].state).toBe(
        'DISABLED',
      );
    });

    it('should include targeting when non-empty', async () => {
      const targeting = { if: [{ in: ['beta', { var: 'groups' }] }] };
      vi.mocked(repository.findAll).mockResolvedValue([
        {
          id: 'uuid-3',
          flagKey: 'targeted-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await uut.buildFlagConfiguration();
      const flagDef = (result.flags as Record<string, any>)['targeted-flag'];

      expect(flagDef.targeting).toEqual(targeting);
    });

    it('should omit targeting when empty', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        {
          id: 'uuid-4',
          flagKey: 'simple-flag',
          enabled: true,
          variants: { on: true, off: false },
          defaultVariant: 'off',
          targeting: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await uut.buildFlagConfiguration();
      const flagDef = (result.flags as Record<string, any>)['simple-flag'];

      expect(flagDef).not.toHaveProperty('targeting');
    });

    it('should transform multiple flags into a keyed object', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        {
          id: 'uuid-1',
          flagKey: 'flag-a',
          enabled: true,
          variants: { on: true },
          defaultVariant: 'on',
          targeting: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'uuid-2',
          flagKey: 'flag-b',
          enabled: false,
          variants: { yes: 'Y', no: 'N' },
          defaultVariant: 'no',
          targeting: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await uut.buildFlagConfiguration();
      const flags = result.flags as Record<string, any>;

      expect(Object.keys(flags)).toHaveLength(2);
      expect(flags['flag-a'].state).toBe('ENABLED');
      expect(flags['flag-b'].state).toBe('DISABLED');
    });
  });
});
