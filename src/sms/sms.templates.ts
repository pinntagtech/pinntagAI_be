import { SMSType } from 'src/enums/auth.enums';
export const SMSTemplates = {
  [SMSType.OTP]: (otp: string) =>
    `Your OTP is: ${otp}. Do not share this with anyone.`,

  [SMSType.WELCOME]: (userName: string) =>
    `Welcome ${userName}! Thank you for signing up. We're glad to have you.`,

  [SMSType.ORDER_CONFIRMATION]: (orderId: string) =>
    `Your order #${orderId} has been confirmed. Thank you for shopping with us!`,

  [SMSType.ALERT]: (message: string) =>
    `ALERT: ${message}. Please take necessary action.`,
};
