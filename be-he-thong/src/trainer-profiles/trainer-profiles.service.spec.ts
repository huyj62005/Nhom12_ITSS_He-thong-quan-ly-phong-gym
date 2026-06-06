import { Test, TestingModule } from '@nestjs/testing';
import { TrainerProfilesService } from './trainer-profiles.service';

describe('TrainerProfilesService', () => {
  let service: TrainerProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainerProfilesService],
    }).compile();

    service = module.get<TrainerProfilesService>(TrainerProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
