import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Otp, OtpDocument } from 'src/auth/models/otp.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { OtpTypes, UserTypes } from 'src/enums/auth.enums';
import { User, UserDocument } from 'src/user/models/user.model';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MailService {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  async sendSampleMail(content: any) {
    this.mailerService.sendMail({
      to: 'rahulmvn13259@gmail.com',
      subject: 'Sample Mail',
      template: process.cwd() + '/src/mail/templates/sampleMail.template.hbs',
      context: {
        content,
      },
    });
  }

  async sendUserWelcomeMail(userId: string) {
    try {
      const user = await this.userService.getUserById(userId);
      this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Pinntag',
        template:
          process.cwd() + '/src/mail/templates/welcomeMail.template.hbs',
        context: {
          name: user.firstName,
        },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendUserVerificationMail(userId: string) {
    try {
      const user = await this.userService.getUserById(userId);
      const otp = await this.userService.saveOtp({
        user: userId,
        type: OtpTypes.EMAIL,
      });
      this.mailerService.sendMail({
        to: user.email,
        subject: 'Two-Factor Authentication',
        template: process.cwd() + '/src/mail/templates/2fa.template.hbs',
        context: {
          name: user.firstName,
          otp,
          otpExpiry: '5 minutes',
        },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendBusinessUserVerificationMail(userId: string) {
    try {
      const profile = await this.businessUserModel.findOne({ _id: userId });
      const otp = await this.userService.saveOtp({
        user: userId,
        type: OtpTypes.EMAIL,
      });
      await this.mailerService.sendMail({
        to: profile.email,
        subject: 'Verify your email',
        template:
          process.cwd() + '/src/mail/templates/mailVerification.template.hbs',
        context: { name: profile.name, otp, otpExpiry: '5 minutes' },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendBusinessTransferOtp(email: string, userId: string) {
    try {
      const profile = await this.businessUserModel.findOne({ _id: userId });
      const otp = await this.userService.saveOtp({
        user: userId,
        type: OtpTypes.EMAIL,
      });
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your email',
        template:
          process.cwd() +
          '/src/mail/templates/ownershipTransferOtpVerification.template.hbs',
        context: { name: profile.name, otp, otpExpiry: '5 minutes' },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendBusinessUserInvitation(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'You have been invited to join a business',
        template:
          process.cwd() +
          '/src/mail/templates/businessUserInvitation.template.hbs',
        context: {
          inviterName: name,
          inviteLink: 'https://dev.business.pinntag.com',
        },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendBusinessVerificationMail(businessId: any) {
    try {
      // const user = await this.userService.getUserById(userId);
      const profile = await this.businessModel.findOne({
        _id: new mongoose.Types.ObjectId(businessId),
      });
      const otp = await this.userService.saveOtp({
        user: businessId,
        type: OtpTypes.EMAIL,
      });
      await this.mailerService.sendMail({
        to: profile.email,
        subject: 'Verify your email',
        template:
          process.cwd() + '/src/mail/templates/mailVerification.template.hbs',
        context: {
          name: profile.name,
          otp,
          otpExpiry: '5 minutes',
        },
      });
    } catch (error) {
      console.error('Error in sending mail!', error);
    }
  }

  async sendForgotPasswordMail(userId: string) {
    const user = await this.userService.getUserById(userId);
    const otp = await this.userService.saveOtp({
      user: userId,
      type: OtpTypes.EMAIL,
    });
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your account password',
      template:
        process.cwd() + '/src/mail/templates/forgotPassword.template.hbs',
      context: {
        name: user.firstName,
        otp,
        otpExpiry: '5 minutes',
      },
    });
  }

  async sendStaffInviteMail(email: string, password: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Staff Invite',
      template: process.cwd() + '/src/mail/templates/invite-email.template.hbs',
      context: {
        password,
      },
    });
  }

  async sendUserReports(totalUsers: number, usersWithFcm: number, file: any) {
    await this.mailerService.sendMail({
      to: 'tony.lynock@pinntag.com',
      // to: 'suraj123@yopmail.com',
      subject: 'Users Reporting',
      template: process.cwd() + '/src/mail/templates/userReports.template.hbs',
      context: {
        totalUsers,
        usersWithFcm,
        usersWithoutFcm: totalUsers - usersWithFcm,
      },
      attachments: [
        {
          filename: `users-fcm-report-${new Date().toLocaleString('default', {
            month: 'long',
          })}.xlsx`,
          content: file,
        },
      ],
    });
  }

  async sendForgotPasswordMail2(
    name: string,
    email: string,
    link: string,
    linkExpiry: string,
  ) {
    // const user = await this.userService.getUserById(userId);
    // const otp = await this.userService.saveOtp({
    //   user: userId,
    //   type: OtpTypes.EMAIL,
    // });
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your account password',
      template:
        process.cwd() + '/src/mail/templates/resetPassword.template.hbs',
      context: { name, link, linkExpiry },
    });
  }
  async sendEmailVerificationMail(name: string, email: string, link: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your Email',
      template:
        process.cwd() +
        '/src/mail/templates/emailVerificationViaLink.template.hbs',
      context: { name, link },
    });
  }
  async sendDownlineUserCredentials(
    name: string,
    email: string,
    password: string,
    loginLink: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Pinntag',
      template:
        process.cwd() + '/src/mail/templates/dowlineUserMail.template.hbs',
      context: { name, email, password, loginLink },
    });
  }

  async businessDocVerificationRequest(
    email: string,
    businessId: string,
    documentType: string,
  ) {
    const business = await this.businessModel.findById(businessId);
    if (!business) throw new BadRequestException('Business not found');

    await this.mailerService.sendMail({
      to: email,
      subject: 'Document Verification',
      template:
        process.cwd() +
        '/src/mail/templates/businessDocVerification.template.hbs',
      context: { name: business.name, documentType, businessId: business.id },
    });
  }
  async consumerInvitation(
    email: string,
    name: string,
    inviteLink: string,
    businessName: string,
  ) {
    console.log(
      'Preparing to send invitation to:',
      email,
      name,
      inviteLink,
      businessName,
    );
    await this.mailerService.sendMail({
      to: email,
      subject: `You have been invited to join ${businessName} on Pinntag`,
      template:
        process.cwd() + '/src/mail/templates/consumerInvitation.template.hbs',
      context: { name, inviteLink, businessName },
    });
  }
}
