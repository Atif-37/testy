import { Module } from '@nestjs/common';
import { SharedService } from 'src/services/shared/shared.service';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  controllers: [MatchController],
  providers: [MatchService, SharedService],
})
export class MatchModule {}
