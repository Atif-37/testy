import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { GetTeamDataDto, GetTeamDto } from './dto';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('')
  async getTeam(@Query() params: GetTeamDto): Promise<any> {
    try {
      const res = await this.teamService.getTeam(params);

      return res;
    } catch (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
  }

  @Get('deposit')
  async getDeposit(@Query() params: GetTeamDataDto): Promise<any> {
    try {
      const res = await this.teamService.getDeposit(params);

      return res;
    } catch (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
  }

  @Get('earning')
  async getEarning(@Query() params: GetTeamDataDto): Promise<any> {
    try {
      const res = await this.teamService.getEarning(params);

      return res;
    } catch (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
  }

  @Get('rank')
  async getRank(@Query() params: GetTeamDataDto): Promise<any> {
    try {
      const res = await this.teamService.getRank(params);

      return res;
    } catch (error) {
      throw new HttpException(
        {
          status: error.status,
          error: error.message,
        },
        error.status,
      );
    }
  }
}
