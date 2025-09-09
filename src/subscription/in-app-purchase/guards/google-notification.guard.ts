import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

const GOOGLE_PACKAGE_NAME = process.env.GOOGLE_PACKAGE_NAME; // e.g. com.pinntag.app
const EXPECTED_TOKEN = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || '';

@Injectable()
export class GoogleNotificationGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const body: any = (req as any).body;

    // Optional: verification token (push subscription attribute or query/header)
    if (EXPECTED_TOKEN) {
      const token =
        (req as any).query?.token ||
        (req as any).headers?.['x-goog-token'] ||
        body?.message?.attributes?.verificationToken;
      if (token !== EXPECTED_TOKEN) {
        throw new UnauthorizedException(
          'Invalid Google Pub/Sub verification token',
        );
      }
    }

    if (!body?.message?.data) {
      throw new BadRequestException('Invalid Pub/Sub envelope');
    }

    // Decode Base64 data -> JSON
    let decoded: any;
    try {
      const json = Buffer.from(body.message.data, 'base64').toString('utf8');
      decoded = JSON.parse(json);
    } catch (e: any) {
      throw new BadRequestException(
        `Unable to parse Pub/Sub data: ${e.message}`,
      );
    }

    // Optional: package name sanity
    if (
      GOOGLE_PACKAGE_NAME &&
      decoded.packageName &&
      decoded.packageName !== GOOGLE_PACKAGE_NAME
    ) {
      throw new UnauthorizedException(
        `packageName mismatch: ${decoded.packageName} != ${GOOGLE_PACKAGE_NAME}`,
      );
    }

    // Optionally verify OIDC signed pushes (Authorization: Bearer <JWT>)
    // - Validate issuer, audience, signature with Google certs (left as extension point)

    (req as any).googleNotification = decoded;
    return true;
  }
}
