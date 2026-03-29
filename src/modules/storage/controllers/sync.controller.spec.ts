import { SyncService } from '../services';
import { SyncController } from './sync.controller';

describe(SyncController.name, () => {
  let uut: SyncController;
  let syncService: SyncService;

  beforeEach(() => {
    syncService = {
      buildFlagConfiguration: vi.fn(),
    } as any;
    uut = new SyncController(syncService);
  });

  describe('getFlags', () => {
    it('should delegate to SyncService.buildFlagConfiguration', async () => {
      const mockConfig = {
        $schema: 'https://flagd.dev/schema/v0/flags.json',
        flags: {
          'my-flag': {
            state: 'ENABLED',
            variants: { on: true, off: false },
            defaultVariant: 'off',
          },
        },
      };
      vi.mocked(syncService.buildFlagConfiguration).mockResolvedValue(
        mockConfig,
      );

      const result = await uut.getFlags();

      expect(result).toEqual(mockConfig);
      expect(syncService.buildFlagConfiguration).toHaveBeenCalledOnce();
    });
  });
});
