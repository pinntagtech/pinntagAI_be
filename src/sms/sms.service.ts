import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Otp, OtpDocument } from 'src/auth/models/otp.model';
import { OtpTypes, SMSType } from 'src/enums/auth.enums';
import { User, UserDocument } from 'src/user/models/user.model';
import { UserService } from 'src/user/user.service';
import twilio from 'twilio';
import { SMSTemplates } from './sms.templates';

export enum SMSTemplateType {
  OTP = 'OTP',
  WELCOME = 'WELCOME',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ALERT = 'ALERT',
  CONSUMER_INVITE = 'CONSUMER_INVITE',
}
@Injectable()
export class SmsService {
  private client: twilio.Twilio;
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {
    this.client = twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendSMS(
    userId: string,
    to: string,
    type: string,
    templateData?: any,
  ) {
    try {
     let messageBody = '';

switch (type) {
  case SMSTemplateType.OTP: {
    const otp = await this.userService.saveOtp({
      user: userId,
      type: OtpTypes.MOBILE,
    });
    messageBody = (SMSTemplates[SMSType.OTP] as (data: any) => string)(String(otp));
    break;
  }
  case SMSTemplateType.CONSUMER_INVITE:
    messageBody = SMSTemplates[SMSType.CONSUMER_INVITE](
      templateData.name,
      templateData.link,
      templateData.businessName
    );
    break;
  case SMSTemplateType.WELCOME:
    messageBody = (SMSTemplates[SMSType.WELCOME] as (data: any) => string)(templateData);
    break;
  case SMSTemplateType.ORDER_CONFIRMATION:
    messageBody = (SMSTemplates[SMSType.ORDER_CONFIRMATION] as (data: any) => string)(templateData);
    break;
  case SMSTemplateType.ALERT:
    messageBody = (SMSTemplates[SMSType.ALERT] as (data: any) => string)(templateData);
    break;
  default:
    throw new Error('Invalid SMS template type');
}

console.log("messageBody:",messageBody);
const message = await this.client.messages.create({
  body: messageBody,
  from: process.env.TWILIO_PHONE_NUMBER,
  to,
});
      // const message = await client.messages.create({
      //   body: `Thank you for signing up! Please confirm your email address by entering the OTP below:${otp}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: to,
      // });
      console.log('message::::', message.sid);
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('Error in sending SMS:', error.message);
      // throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}
