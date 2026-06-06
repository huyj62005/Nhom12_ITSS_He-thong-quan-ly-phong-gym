import { Module } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { MemberPackagesController } from './member-packages.controller';

@Module({
  controllers: [MemberPackagesController],
  providers: [MemberPackagesService],
})
export class MemberPackagesModule {}
