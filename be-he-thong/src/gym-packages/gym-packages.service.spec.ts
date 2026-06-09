import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GymPackagesService } from './gym-packages.service';
import { GymPackage } from './entities/gym-package.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';

describe('GymPackagesService', () => {
  let service: GymPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GymPackagesService,
        {
          provide: getRepositoryToken(GymPackage),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MemberPackage),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GymPackagesService>(GymPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
