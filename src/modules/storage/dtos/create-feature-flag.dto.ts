import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({
    example: 'new-dashboard-ui',
    description: 'Unique key identifying the feature flag',
  })
  @IsString()
  @IsNotEmpty()
  flagKey: string;

  @ApiProperty({
    example: true,
    description: 'Whether the flag is enabled',
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: { model: 'deepseek-r1' },
    description: 'Flag variants with their values',
  })
  @IsObject()
  variants: Record<string, unknown>;

  @ApiProperty({
    example: 'off',
    description: 'The default variant key',
  })
  @IsString()
  @IsNotEmpty()
  defaultVariant: string;

  @ApiProperty({
    description: 'Targeting rules for the flag',
    example: {},
  })
  @IsObject()
  targeting: Record<string, unknown>;
}
