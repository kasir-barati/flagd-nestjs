import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateFeatureFlagDto,
  FeatureFlagResponseDto,
  UpdateFeatureFlagDto,
} from '../dtos';
import { StorageService } from '../services';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiOkResponse({
    type: [FeatureFlagResponseDto],
    description: 'List of all feature flags',
  })
  async findAll(): Promise<FeatureFlagResponseDto[]> {
    return this.storageService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag by ID' })
  @ApiOkResponse({
    type: FeatureFlagResponseDto,
    description: 'The feature flag',
  })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  async findById(@Param('id') id: string): Promise<FeatureFlagResponseDto> {
    return this.storageService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiCreatedResponse({
    type: FeatureFlagResponseDto,
    description: 'The created feature flag',
  })
  @ApiConflictResponse({
    description: 'Feature flag with the same key already exists',
  })
  async create(
    @Body() dto: CreateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.storageService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiOkResponse({
    type: FeatureFlagResponseDto,
    description: 'The updated feature flag',
  })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  @ApiConflictResponse({
    description: 'Feature flag with the same key already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.storageService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiNoContentResponse({ description: 'Feature flag deleted successfully' })
  @ApiNotFoundResponse({ description: 'Feature flag not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.storageService.delete(id);
  }
}
