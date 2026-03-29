import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'new-dashboard-ui' })
  flagKey!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: { model: 'deepseek-r1' } })
  variants!: Record<string, unknown>;

  @ApiProperty({ example: 'off' })
  defaultVariant!: string;

  @ApiProperty({ example: {} })
  targeting!: Record<string, unknown>;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
