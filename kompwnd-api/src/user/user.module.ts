import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DepositService } from 'src/deposit/deposit.service';
import { MatchService } from 'src/match/match.service';
import { ReferralService } from 'src/referral/referral.service';
import { RewardService } from 'src/reward/reward.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { EncryptionService } from 'src/services/encryption/encryption.service';
import { SharedService } from 'src/services/shared/shared.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    EncryptionService,
    JwtService,
    AlaioService,
    DepositService,
    RewardService,
    ReferralService,
    MatchService,
    SharedService,
  ],
  exports: [UserService],
})
export class UserModule {
  // constructor(private configService: ConfigService) {
  //   console.log('neo4j scheme =>', configService.get('neo4j.scheme'));
  // }
  // onModuleInit() {
  //   console.log('neo4j scheme =>', this.configService.get('neo4j.scheme'));
  // }
}
