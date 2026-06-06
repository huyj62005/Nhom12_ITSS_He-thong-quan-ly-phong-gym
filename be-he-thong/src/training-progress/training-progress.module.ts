import { Module } from '@nestjs/common';
import { TrainingProgressService } from './training-progress.service';
import { TrainingProgressController } from './training-progress.controller';

@Module({
  controllers: [TrainingProgressController],
  providers: [TrainingProgressService],
})
export class TrainingProgressModule {}
