import { Test, TestingModule } from '@nestjs/testing';
import { MemberPackagesService } from './member-packages.service';

describe('MemberPackagesService', () => {
  let service: MemberPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberPackagesService],
    }).compile();

    service = module.get<MemberPackagesService>(MemberPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
