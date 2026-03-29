import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({
    example: 'new-dashboard-ui',
    description: 'Unique key identifying the feature flag',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  flagKey?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the flag is enabled',
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({
    example: { model: 'deepseek-r1' },
    description: 'Flag variants with their values',
  })
  @IsObject()
  @IsOptional()
  variants?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'off',
    description: 'The default variant key',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  defaultVariant?: string;

  @ApiPropertyOptional({
    example: {},
    description: 'Targeting rules for the flag',
  })
  @IsObject()
  @IsOptional()
  targeting?: Record<string, unknown>;
}
