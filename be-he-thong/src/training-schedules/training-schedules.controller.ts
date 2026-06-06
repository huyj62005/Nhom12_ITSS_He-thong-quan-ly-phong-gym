import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainingSchedulesService } from './training-schedules.service';
import { CreateTrainingScheduleDto } from './dto/create-training-schedule.dto';
import { UpdateTrainingScheduleDto } from './dto/update-training-schedule.dto';

@Controller('training-schedules')
export class TrainingSchedulesController {
  constructor(private readonly trainingSchedulesService: TrainingSchedulesService) {}

  @Post()
  create(@Body() createTrainingScheduleDto: CreateTrainingScheduleDto) {
    return this.trainingSchedulesService.create(createTrainingScheduleDto);
  }

  @Get()
  findAll() {
    return this.trainingSchedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingSchedulesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingScheduleDto: UpdateTrainingScheduleDto) {
    return this.trainingSchedulesService.update(+id, updateTrainingScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingSchedulesService.remove(+id);
  }
}
