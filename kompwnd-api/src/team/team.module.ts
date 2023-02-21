import { Module } from '@nestjs/common';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { AlaioService } from 'src/services/alaio/alaio.service';
import { UserService } from 'src/user/user.service';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  controllers: [TeamController],
  providers: [TeamService, DashboardService, UserService, AlaioService],
})
export class TeamModule {}
