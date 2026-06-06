import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingScheduleDto } from './create-training-schedule.dto';

export class UpdateTrainingScheduleDto extends PartialType(CreateTrainingScheduleDto) {}
