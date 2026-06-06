import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingProgressDto } from './create-training-progress.dto';

export class UpdateTrainingProgressDto extends PartialType(CreateTrainingProgressDto) {}
