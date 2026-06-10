import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  async create(createDto: CreateExerciseDto) {
    const exercise = this.exerciseRepository.create(createDto);
    return this.exerciseRepository.save(exercise);
  }

  async findAll() {
    return this.exerciseRepository.find();
  }

  async findOne(id: number) {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async update(id: number, updateDto: UpdateExerciseDto) {
    await this.findOne(id);

    await this.exerciseRepository.update(id, updateDto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const exercise = await this.findOne(id);

    await this.exerciseRepository.remove(exercise);

    return {
      message: 'Exercise deleted successfully',
    };
  }
}
