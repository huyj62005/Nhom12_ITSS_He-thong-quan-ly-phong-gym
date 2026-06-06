import { Injectable } from '@nestjs/common';
import { CreateTrainerProfileDto } from './dto/create-trainer-profile.dto';
import { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';

@Injectable()
export class TrainerProfilesService {
  create(createTrainerProfileDto: CreateTrainerProfileDto) {
    return 'This action adds a new trainerProfile';
  }

  findAll() {
    return `This action returns all trainerProfiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} trainerProfile`;
  }

  update(id: number, updateTrainerProfileDto: UpdateTrainerProfileDto) {
    return `This action updates a #${id} trainerProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} trainerProfile`;
  }
}
