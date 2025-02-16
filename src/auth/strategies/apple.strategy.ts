import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@arendajaelu/nestjs-passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENTID,
      teamID: process.env.APPLE_TEAMID,
      keyID: process.env.APPLE_KEYID,
      keyFilePath: process.env.APPLE_KEYFILE_PATH,
      callbackURL: process.env.APPLE_CALLBACK,
      passReqToCallback: false,
      scope: ['email', 'name'],
    });
  }
}
