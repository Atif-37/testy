import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import * as ecc from 'eosjs-ecc';

@Injectable()
export class EncryptionService {
  constructor(private readonly jwtService: JwtService) {}

  generateJWT(user: User): Promise<string> {
    return this.jwtService.signAsync({ user });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, process.env.HASH_ROUNDS);
  }

  comparePasswords(
    newPassword: string,
    passwortHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(newPassword, passwortHash);
  }

  generateSignature(...params: string[]) {
    const data = params.join(',');
    const wif = process.env.PRIVATE_KEY;

    const sig = ecc.sign(data, wif);

    return sig;
  }
}
