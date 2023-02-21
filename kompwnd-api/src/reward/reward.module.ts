import { Module } from '@nestjs/common';
import { MatchService } from 'src/match/match.service';
import { ReferralService } from 'src/referral/referral.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { SharedService } from 'src/services/shared/shared.service';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';

@Module({
  controllers: [RewardController],
  providers: [
    RewardService,
    AlaioService,
    SharedService,
    ReferralService,
    MatchService,
  ],
  exports: [RewardService],
})
export class RewardModule {}
