import { Test, TestingModule } from '@nestjs/testing';
import { GymPackagesController } from './gym-packages.controller';
import { GymPackagesService } from './gym-packages.service';

describe('GymPackagesController', () => {
  let controller: GymPackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymPackagesController],
      providers: [
        {
          provide: GymPackagesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<GymPackagesController>(GymPackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
