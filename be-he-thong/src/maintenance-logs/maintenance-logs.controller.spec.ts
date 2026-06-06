import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceLogsController } from './maintenance-logs.controller';
import { MaintenanceLogsService } from './maintenance-logs.service';

describe('MaintenanceLogsController', () => {
  let controller: MaintenanceLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceLogsController],
      providers: [MaintenanceLogsService],
    }).compile();

    controller = module.get<MaintenanceLogsController>(MaintenanceLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
