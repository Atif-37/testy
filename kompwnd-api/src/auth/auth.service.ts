import { BadRequestException, Injectable } from '@nestjs/common';
import { EncryptionService } from 'src/services/encryption/encryption.service';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private encryptionService: EncryptionService,
    private userService: UserService,
  ) {}

  async login(props: any): Promise<any> {
    const user: User = await this.validateUser(props.account_name, props.pin);

    if (!user) throw new BadRequestException('User does not exist.');

    const jwt = await this.encryptionService.generateJWT(user);
    return { access_token: jwt };
  }

  async authenticate(props: any): Promise<any> {
    let user: User = await this.validateUser(props.account_name, props.pin);
    if (!user) {
      const res = await this.userService.addUser(props);

      if (res.result) {
        const { pin_hash, ...eUser } = res.result;
        user = eUser;
      }
    }
    const jwt = await this.encryptionService.generateJWT(user);

    return { access_token: jwt, user };
  }

  async resetPin(props: any): Promise<string> {
    const user: User = await this.validateUser(props.account_name, props.pin);
    if (!user) throw new BadRequestException('User does not exist.');
    return await this.userService.updatePin({
      ...props,
      ...user,
    });
  }

  async validateUser(account_name: string, pin: string): Promise<User> {
    const user: User = await this.userService.findByAccountName(account_name);

    if (user) {
      const match = await this.encryptionService.comparePasswords(
        pin,
        user.pin_hash,
      );
      if (match) {
        const { pin_hash, ...result } = user;
        return result;
      } else {
        throw new BadRequestException('Invalid password.');
      }
    } else {
      return null;
    }
  }
}
