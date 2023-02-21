import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { SharedService } from 'src/services/shared/shared.service';
import { UpdateUserDto, GetUserDto, AddBuddyDto } from './dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sharedService: SharedService,
  ) {}

  @Get('')
  async getUsers(
    @Query()
    params: GetUserDto,
  ): Promise<any> {
    const res = await this.userService.getUsers(params);
    return res;
  }

  @UseGuards(JwtGuard)
  @Get('buddy')
  async getBuddy(@Request() req: any): Promise<any> {
    try {
      const res = await this.sharedService.getBuddy(req.user.account_name);

      return { buddy: res };
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
  @Put('')
  async updateUser(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    const res = await this.userService.updateUser(req.user.id, updateUserDto);
    return res;
  }

  @UseGuards(JwtGuard)
  @Delete('')
  async deleteUser(@Request() req: any): Promise<any> {
    const res = await this.userService.deleteUser(req.user.id);
    return res;
  }

  @UseGuards(JwtGuard)
  @Post('buddy')
  async addBuddy(
    @Request() req: any,
    @Body() addBuddyDto: AddBuddyDto,
  ): Promise<any> {
    try {
      const res = await this.userService.addBuddy({
        ...req.user,
        ...addBuddyDto,
      });

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
