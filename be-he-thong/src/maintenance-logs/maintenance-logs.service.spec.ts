import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceLogsService } from './maintenance-logs.service';

describe('MaintenanceLogsService', () => {
  let service: MaintenanceLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceLogsService],
    }).compile();

    service = module.get<MaintenanceLogsService>(MaintenanceLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
