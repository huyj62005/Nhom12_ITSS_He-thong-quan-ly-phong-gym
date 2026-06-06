import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainingProgressService } from './training-progress.service';
import { CreateTrainingProgressDto } from './dto/create-training-progress.dto';
import { UpdateTrainingProgressDto } from './dto/update-training-progress.dto';

@Controller('training-progress')
export class TrainingProgressController {
  constructor(private readonly trainingProgressService: TrainingProgressService) {}

  @Post()
  create(@Body() createTrainingProgressDto: CreateTrainingProgressDto) {
    return this.trainingProgressService.create(createTrainingProgressDto);
  }

  @Get()
  findAll() {
    return this.trainingProgressService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingProgressService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainingProgressDto: UpdateTrainingProgressDto) {
    return this.trainingProgressService.update(+id, updateTrainingProgressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainingProgressService.remove(+id);
  }
}
