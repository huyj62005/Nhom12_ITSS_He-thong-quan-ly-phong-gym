import { Test, TestingModule } from '@nestjs/testing';
import { TrainerProfilesController } from './trainer-profiles.controller';
import { TrainerProfilesService } from './trainer-profiles.service';

describe('TrainerProfilesController', () => {
  let controller: TrainerProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainerProfilesController],
      providers: [TrainerProfilesService],
    }).compile();

    controller = module.get<TrainerProfilesController>(TrainerProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
