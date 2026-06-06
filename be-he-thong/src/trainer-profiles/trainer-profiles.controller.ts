import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrainerProfilesService } from './trainer-profiles.service';
import { CreateTrainerProfileDto } from './dto/create-trainer-profile.dto';
import { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';

@Controller('trainer-profiles')
export class TrainerProfilesController {
  constructor(private readonly trainerProfilesService: TrainerProfilesService) {}

  @Post()
  create(@Body() createTrainerProfileDto: CreateTrainerProfileDto) {
    return this.trainerProfilesService.create(createTrainerProfileDto);
  }

  @Get()
  findAll() {
    return this.trainerProfilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainerProfilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainerProfileDto: UpdateTrainerProfileDto) {
    return this.trainerProfilesService.update(+id, updateTrainerProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainerProfilesService.remove(+id);
  }
}
