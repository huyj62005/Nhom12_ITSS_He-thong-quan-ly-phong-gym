import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WorkoutExercise } from './entities/workout-exercise.entity';
import { CreateWorkoutExerciseDto } from './dto/create-workout-exercise.dto';
import { UpdateWorkoutExerciseDto } from './dto/update-workout-exercise.dto';

@Injectable()
export class WorkoutExercisesService {
  constructor(
    @InjectRepository(WorkoutExercise)
    private readonly repo: Repository<WorkoutExercise>,
  ) {}

  // CREATE
  async create(dto: CreateWorkoutExerciseDto): Promise<WorkoutExercise> {
    const entity = this.repo.create({
      sets: dto.sets,
      reps: dto.reps,
      weight: dto.weight,
      note: dto.note,

      session: {
        id: dto.sessionId,
      } as any,

      exercise: dto.exerciseId ? ({ id: dto.exerciseId } as any) : null,
    });

    return this.repo.save(entity);
  }

  // FIND ALL
  async findAll(): Promise<WorkoutExercise[]> {
    return this.repo.find({
      relations: {
        session: true,
        exercise: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  // FIND ONE
  async findOne(id: number): Promise<WorkoutExercise> {
    const data = await this.repo.findOne({
      where: { id },
      relations: {
        session: true,
        exercise: true,
      },
    });

    if (!data) {
      throw new NotFoundException(`WorkoutExercise with ID ${id} not found`);
    }

    return data;
  }

  // UPDATE
  async update(
    id: number,
    dto: UpdateWorkoutExerciseDto,
  ): Promise<WorkoutExercise> {
    const entity = await this.findOne(id);

    if (dto.sessionId) {
      entity.session = { id: dto.sessionId } as any;
    }

    if (dto.exerciseId !== undefined) {
      entity.exercise = dto.exerciseId ? ({ id: dto.exerciseId } as any) : null;
    }

    Object.assign(entity, {
      sets: dto.sets,
      reps: dto.reps,
      weight: dto.weight,
      note: dto.note,
    });

    return this.repo.save(entity);
  }

  // DELETE
  async remove(id: number): Promise<void> {
    const data = await this.findOne(id);
    await this.repo.remove(data);
  }

  // OPTIONAL: get exercises by session
  async findBySession(sessionId: number): Promise<WorkoutExercise[]> {
    return this.repo.find({
      where: {
        session: {
          id: sessionId,
        },
      },
      relations: {
        exercise: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  // OPTIONAL: get exercises by exercise type
  async findByExercise(exerciseId: number): Promise<WorkoutExercise[]> {
    return this.repo.find({
      where: {
        exercise: {
          id: exerciseId,
        },
      },
      relations: {
        session: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }
}
