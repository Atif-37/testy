import {
  Controller,
  Get,
  HttpException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @UseGuards(JwtGuard)
  @Get('')
  async getDashboard(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getDashboard(
        req.user.account_name,
      );

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

  @UseGuards(JwtGuard)
  @Get('withdrawal')
  async getWithdrawals(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getWithdrawals(
        req.user.account_name,
      );

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

  @UseGuards(JwtGuard)
  @Get('deposit')
  async getDeposits(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getDeposits(
        req.user.account_name,
      );

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

  @UseGuards(JwtGuard)
  @Get('referral')
  async getReferrals(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getReferrals(
        req.user.account_name,
      );

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

  @UseGuards(JwtGuard)
  @Get('dividend')
  async getDividends(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getDividends(
        req.user.account_name,
      );

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

  @UseGuards(JwtGuard)
  @Get('match')
  async getMatches(@Request() req: any): Promise<any> {
    try {
      const res = await this.dashboardService.getMatches(req.user.account_name);

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
