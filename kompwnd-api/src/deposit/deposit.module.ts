import { Module } from '@nestjs/common';
import { ReferralService } from 'src/referral/referral.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { SharedService } from 'src/services/shared/shared.service';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';

@Module({
  controllers: [DepositController],
  providers: [DepositService, AlaioService, ReferralService, SharedService],
  exports: [DepositService],
})
export class DepositModule {}
