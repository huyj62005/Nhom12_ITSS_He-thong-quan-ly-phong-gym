import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkoutSessionsService } from './workout-sessions.service';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { UpdateWorkoutSessionDto } from './dto/update-workout-session.dto';

@Controller('workout-sessions')
export class WorkoutSessionsController {
  constructor(private readonly workoutSessionsService: WorkoutSessionsService) {}

  @Post()
  create(@Body() createWorkoutSessionDto: CreateWorkoutSessionDto) {
    return this.workoutSessionsService.create(createWorkoutSessionDto);
  }

  @Get()
  findAll() {
    return this.workoutSessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutSessionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkoutSessionDto: UpdateWorkoutSessionDto) {
    return this.workoutSessionsService.update(+id, updateWorkoutSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workoutSessionsService.remove(+id);
  }
}
