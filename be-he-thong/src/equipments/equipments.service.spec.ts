import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { Equipment } from './entities/equipment.entity';

describe('EquipmentsService', () => {
  let service: EquipmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentsService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EquipmentsService>(EquipmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
