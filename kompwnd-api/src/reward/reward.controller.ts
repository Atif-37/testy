import {
  Controller,
  Get,
  HttpException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { RewardService } from './reward.service';

@Controller('reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @UseGuards(JwtGuard)
  @Get('')
  async calculateReward(@Request() req: any): Promise<any> {
    try {
      const res = await this.rewardService.calculateReward(
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
  @Post('claim')
  async claimReward(@Request() req: any): Promise<any> {
    try {
      const res = await this.rewardService.claimReward(req.user.account_name);

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
  @Post('roll')
  async rollReward(@Request() req: any): Promise<any> {
    try {
      const res = await this.rewardService.rollReward(req.user.account_name);

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
