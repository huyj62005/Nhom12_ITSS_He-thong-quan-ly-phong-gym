import { Test, TestingModule } from '@nestjs/testing';
import { GymPackagesService } from './gym-packages.service';

describe('GymPackagesService', () => {
  let service: GymPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GymPackagesService],
    }).compile();

    service = module.get<GymPackagesService>(GymPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
