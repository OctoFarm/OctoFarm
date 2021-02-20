import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import { CreateMonitoringDto } from '../dto/create-monitoring.dto';
import { UpdateMonitoringDto } from '../dto/update-monitoring.dto';
import {ApiTags} from "@nestjs/swagger";

@Controller('alerts')
@ApiTags(AlertsController.name)
export class AlertsController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post()
  create(@Body() createMonitoringDto: CreateMonitoringDto) {
    return this.monitoringService.create(createMonitoringDto);
  }

  @Get()
  findAll() {
    return this.monitoringService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monitoringService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateMonitoringDto: UpdateMonitoringDto) {
    return this.monitoringService.update(+id, updateMonitoringDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monitoringService.remove(+id);
  }
}
