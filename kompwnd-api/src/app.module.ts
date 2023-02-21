import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from 'nest-neo4j';
import { AppGateway } from './app.gateway';
import { DemuxService } from './services/demux/demux.service';
import { AlaioService } from './services/alaio/alaio.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EncryptionService } from './services/encryption/encryption.service';
import { JwtService } from '@nestjs/jwt';
import { DepositModule } from './deposit/deposit.module';
import { ReferralModule } from './referral/referral.module';
import { DividendModule } from './dividend/dividend.module';
import { MatchModule } from './match/match.module';
import { RewardModule } from './reward/reward.module';
import { SharedService } from './services/shared/shared.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: `${__dirname}/config/env/${process.env.NODE_ENV}.env`,
      // load: [configuration],
    }),
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
        // port: configService.get('NEO4J_PORT'),
      }),
    }),
    UserModule,
    AuthModule,
    DepositModule,
    ReferralModule,
    DividendModule,
    MatchModule,
    RewardModule,
    DashboardModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppGateway,
    DemuxService,
    AlaioService,
    EncryptionService,
    JwtService,
    SharedService,
  ],
})
export class AppModule {}
