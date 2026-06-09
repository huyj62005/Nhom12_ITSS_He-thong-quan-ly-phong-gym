import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MemberPackagesService } from './member-packages.service';
import { MemberPackage } from './entities/member-package.entity';
import { Member } from '../members/entities/member.entity';
import { GymPackage } from '../gym-packages/entities/gym-package.entity';
import { User } from '../users/entities/user.entity';

describe('MemberPackagesService', () => {
  let service: MemberPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberPackagesService,
        {
          provide: getRepositoryToken(MemberPackage),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Member),
          useValue: {},
        },
        {
          provide: getRepositoryToken(GymPackage),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MemberPackagesService>(MemberPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
