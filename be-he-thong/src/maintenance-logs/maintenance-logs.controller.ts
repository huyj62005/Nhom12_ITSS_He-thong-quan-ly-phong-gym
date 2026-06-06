import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaintenanceLogsService } from './maintenance-logs.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';

@Controller('maintenance-logs')
export class MaintenanceLogsController {
  constructor(private readonly maintenanceLogsService: MaintenanceLogsService) {}

  @Post()
  create(@Body() createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return this.maintenanceLogsService.create(createMaintenanceLogDto);
  }

  @Get()
  findAll() {
    return this.maintenanceLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaintenanceLogDto: UpdateMaintenanceLogDto) {
    return this.maintenanceLogsService.update(+id, updateMaintenanceLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceLogsService.remove(+id);
  }
}
