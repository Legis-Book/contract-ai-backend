import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';
import { StandardClause } from '../../generated/prisma';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @Body() createStandardClauseDto: CreateStandardClauseDto,
  ): Promise<StandardClause> {
    return this.templatesService.create(createStandardClauseDto);
  }

  @Get()
  findAll(): Promise<StandardClause[]> {
    return this.templatesService.findAll();
  }

  @Get('type/:type')
  findByType(@Param('type') type: string): Promise<StandardClause[]> {
    return this.templatesService.findByType(type);
  }

  @Get('jurisdiction/:jurisdiction')
  findByJurisdiction(
    @Param('jurisdiction') jurisdiction: string,
  ): Promise<StandardClause[]> {
    return this.templatesService.findByJurisdiction(jurisdiction);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StandardClause> {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStandardClauseDto: UpdateStandardClauseDto,
  ): Promise<StandardClause> {
    return this.templatesService.update(id, updateStandardClauseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.templatesService.remove(id);
  }
}
