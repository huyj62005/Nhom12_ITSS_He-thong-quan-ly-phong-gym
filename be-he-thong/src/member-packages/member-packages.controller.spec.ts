import { Test, TestingModule } from '@nestjs/testing';
import { MemberPackagesController } from './member-packages.controller';
import { MemberPackagesService } from './member-packages.service';

describe('MemberPackagesController', () => {
  let controller: MemberPackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberPackagesController],
      providers: [
        {
          provide: MemberPackagesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MemberPackagesController>(MemberPackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
