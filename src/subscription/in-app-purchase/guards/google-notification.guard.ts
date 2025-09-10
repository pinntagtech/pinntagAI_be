// google-notification.guard.ts
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const GOOGLE_PACKAGE_NAME = process.env.GOOGLE_PACKAGE_NAME || '';
const EXPECTED_AUDIENCE = process.env.GOOGLE_PUBSUB_OIDC_AUDIENCE || ''; // full webhook URL
const EXPECTED_PUSH_SA_EMAIL =
  process.env.GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL || '';

/**
 * Verifies Google Cloud Pub/Sub signed push (OIDC) JWT and decodes RTDN body.
 * - Validates JWT signature with Google public keys.
 * - Ensures 'aud' == your webhook URL (or computed URL if you prefer).
 * - Ensures 'iss' is Google Accounts.
 * - Ensures 'email' matches the service account you configured on the push subscription.
 * - Decodes base64 message.data into JSON and attaches to req.googleNotification.
 */
@Injectable()
export class GoogleNotificationGuard implements CanActivate {
  private oauth = new OAuth2Client();

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<any>();
    const body = req.body;

    // 1) Read and verify OIDC Bearer token
    const authz = req.headers?.authorization || req.headers?.Authorization;
    if (!authz || typeof authz !== 'string' || !authz.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token for Pub/Sub OIDC');
    }
    const idToken = authz.substring('Bearer '.length).trim();
    if (!idToken) {
      throw new UnauthorizedException('Empty OIDC token');
    }

    // Use configured audience or derive from request (recommended: configure explicitly)
    const audience = EXPECTED_AUDIENCE || this.deriveAudienceFromRequest(req);

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.oauth.verifyIdToken({
        idToken,
        audience, // the push endpoint URL
      });
      payload = ticket.getPayload();
    } catch (e: any) {
      throw new UnauthorizedException(`Invalid OIDC token: ${e.message}`);
    }
    if (!payload) {
      throw new UnauthorizedException('No payload in OIDC token');
    }

    // Validate issuer & audience
    const iss = payload.iss;
    if (
      iss !== 'https://accounts.google.com' &&
      iss !== 'accounts.google.com'
    ) {
      throw new UnauthorizedException(`Unexpected OIDC issuer: ${iss}`);
    }
    if (payload.aud !== audience) {
      throw new UnauthorizedException(
        `OIDC audience mismatch. expected=${audience} got=${payload.aud}`,
      );
    }

    // Optional but recommended: ensure token is the service account you configured
    if (EXPECTED_PUSH_SA_EMAIL) {
      const email = payload.email;
      if (!email || email !== EXPECTED_PUSH_SA_EMAIL) {
        throw new UnauthorizedException(
          `Push SA email mismatch. expected=${EXPECTED_PUSH_SA_EMAIL} got=${email}`,
        );
      }
      if (payload.email_verified === false) {
        throw new UnauthorizedException('Push SA email not verified');
      }
    }

    // 2) Validate Pub/Sub envelope + decode base64 data → JSON
    if (!body?.message?.data) {
      throw new BadRequestException(
        'Invalid Pub/Sub envelope: missing message.data',
      );
    }

    let decoded: any;
    try {
      const json = Buffer.from(body.message.data, 'base64').toString('utf8');
      decoded = JSON.parse(json);
    } catch (e: any) {
      throw new BadRequestException(
        `Unable to parse Pub/Sub data: ${e.message}`,
      );
    }

    // 3) Optional packageName sanity check
    if (
      GOOGLE_PACKAGE_NAME &&
      decoded.packageName &&
      decoded.packageName !== GOOGLE_PACKAGE_NAME
    ) {
      throw new UnauthorizedException(
        `packageName mismatch: ${decoded.packageName} != ${GOOGLE_PACKAGE_NAME}`,
      );
    }

    // 4) Attach decoded notification for the controller/service
    req.googleNotification = decoded;

    return true;
  }

  /** If you prefer dynamic audience, you can compute it from the incoming request */
  private deriveAudienceFromRequest(req: any): string {
    const proto =
      (req.headers['x-forwarded-proto'] as string) ||
      (req.protocol as string) ||
      'https';
    const host =
      (req.headers['x-forwarded-host'] as string) ||
      (req.headers['host'] as string);
    const path = req.originalUrl || req.url || '';
    return `${proto}://${host}${path}`;
  }
}

// import {
//   BadRequestException,
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';

// const GOOGLE_PACKAGE_NAME = process.env.GOOGLE_PACKAGE_NAME; // e.g. com.pinntag.app
// const EXPECTED_TOKEN = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || '';

// @Injectable()
// export class GoogleNotificationGuard implements CanActivate {
//   canActivate(ctx: ExecutionContext): boolean {
//     const req = ctx.switchToHttp().getRequest<Request>();
//     const body: any = (req as any).body;

//     // Optional: verification token (push subscription attribute or query/header)
//     if (EXPECTED_TOKEN) {
//       const token =
//         (req as any).query?.token ||
//         (req as any).headers?.['x-goog-token'] ||
//         body?.message?.attributes?.verificationToken;
//       if (token !== EXPECTED_TOKEN) {
//         throw new UnauthorizedException(
//           'Invalid Google Pub/Sub verification token',
//         );
//       }
//     }

//     if (!body?.message?.data) {
//       throw new BadRequestException('Invalid Pub/Sub envelope');
//     }

//     // Decode Base64 data -> JSON
//     let decoded: any;
//     try {
//       const json = Buffer.from(body.message.data, 'base64').toString('utf8');
//       decoded = JSON.parse(json);
//     } catch (e: any) {
//       throw new BadRequestException(
//         `Unable to parse Pub/Sub data: ${e.message}`,
//       );
//     }

//     // Optional: package name sanity
//     if (
//       GOOGLE_PACKAGE_NAME &&
//       decoded.packageName &&
//       decoded.packageName !== GOOGLE_PACKAGE_NAME
//     ) {
//       throw new UnauthorizedException(
//         `packageName mismatch: ${decoded.packageName} != ${GOOGLE_PACKAGE_NAME}`,
//       );
//     }

//     // Optionally verify OIDC signed pushes (Authorization: Bearer <JWT>)
//     // - Validate issuer, audience, signature with Google certs (left as extension point)

//     (req as any).googleNotification = decoded;
//     return true;
//   }
// }
