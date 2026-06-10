import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Member } from '../members/entities/member.entity';
import { MemberPackage } from '../member-packages/entities/member-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Member, MemberPackage])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
