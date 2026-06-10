import { Module } from '@nestjs/common';
import { ExerciseService } from './exercises.service';
import { ExercisesController } from './exercises.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],

  controllers: [ExercisesController],
  providers: [ExerciseService],
})
export class ExercisesModule {}
