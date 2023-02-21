import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ResetPinDto } from './dto';
import { JwtGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<any> {
    const res = await this.authService.login(loginDto);
    return res;
  }

  @Post('authenticate')
  async authenticate(@Body() authenticationDto: LoginDto): Promise<any> {
    const res = await this.authService.authenticate(authenticationDto);
    return res;
  }

  @UseGuards(JwtGuard)
  @Post('reset-pin')
  async resetPin(
    @Request() req: any,
    @Body() resetPinDto: ResetPinDto,
  ): Promise<any> {
    const res = await this.authService.resetPin({
      ...req.user,
      ...resetPinDto,
    });
    return res;
  }
}
