import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import { TokenTypes } from 'src/enums/auth.enums';
import { CronExpression } from 'src/enums/event.enums';
import { MailService } from 'src/mail/mail.service';
import { User, UserDocument } from 'src/user/models/user.model';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly mailerService: MailService,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_12_40PM)
  async sendFcmReport() {
    //Fetch users registered before 24 november 2024
    // const users = await this.userModel.find({
    //   createdAt: { $lte: new Date('2024-11-24') },
    // });
    // //Fetch fcm tokens for those users
    // const fcmTokens = await this.tokenModel.find({
    //   type: TokenTypes.FCM,
    //   user: { $in: users.map((user) => user._id) },
    // });
    // await this.mailerService.sendUserReports(users.length, fcmTokens.length);
  }
}
