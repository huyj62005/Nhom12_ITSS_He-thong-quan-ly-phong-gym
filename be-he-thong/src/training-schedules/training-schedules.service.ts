import { Injectable } from '@nestjs/common';
import { CreateTrainingScheduleDto } from './dto/create-training-schedule.dto';
import { UpdateTrainingScheduleDto } from './dto/update-training-schedule.dto';

@Injectable()
export class TrainingSchedulesService {
  create(createTrainingScheduleDto: CreateTrainingScheduleDto) {
    return 'This action adds a new trainingSchedule';
  }

  findAll() {
    return `This action returns all trainingSchedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} trainingSchedule`;
  }

  update(id: number, updateTrainingScheduleDto: UpdateTrainingScheduleDto) {
    return `This action updates a #${id} trainingSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} trainingSchedule`;
  }
}
