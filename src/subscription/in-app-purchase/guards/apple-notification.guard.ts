import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

const APP_BUNDLE_ID = process.env.APP_BUNDLE_ID; // e.g. com.pinntag.app
const APP_APPLE_ID = process.env.APP_APPLE_ID; // optional: numerical appAppleId
const ALLOWED_ALGS = new Set(['ES256', 'ES256']); // Apple ASNs generally ES256

// SHA-256 fingerprint of Apple Root CA - G3 (DER). Keep updated from Apple docs when they rotate.
// This is a known stable fingerprint at time of writing; replace if Apple updates their root.
const APPLE_ROOT_G3_SHA256 = (process.env.APPLE_ROOT_G3_SHA256 || '')
  .toLowerCase()
  .replace(/[^a-f0-9]/g, '');

function b64urlToBuffer(input: string): Buffer {
  // base64url => base64
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

function certDerToSha256Hex(der: Buffer): string {
  const fp = crypto.createHash('sha256').update(der).digest('hex');
  return fp.toLowerCase();
}

@Injectable()
export class AppleNotificationGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      console.log('AppleNotificationGuard: verifying request');
      const req = ctx.switchToHttp().getRequest<Request>();
      const body: any = (req as any).body;
      if (!body || !body['signedPayload']) {
        console.error('AppleNotificationGuard: missing signedPayload');
        throw new BadRequestException('Missing signedPayload');
      }

      const signedPayload: string = body['signedPayload'];
      console.log('AppleNotificationGuard: received signedPayload');
      const parts = signedPayload.split('.');
      if (parts.length !== 3) {
        console.error('AppleNotificationGuard: Invalid JWS format');
        throw new BadRequestException('Invalid JWS format');
      }

      const [headerB64u, payloadB64u, sigB64u] = parts;
      const headerJson = b64urlToBuffer(headerB64u).toString('utf8');
      const payloadJson = b64urlToBuffer(payloadB64u).toString('utf8');
      const sigB64uBuf = b64urlToBuffer(sigB64u).toString('utf8');
      console.log('AppleNotificationGuard: decoded header:', headerJson);
      console.log('AppleNotificationGuard: decoded payload:', payloadJson);
      console.log('AppleNotificationGuard: signature:', sigB64uBuf);
      let header: any, payload: any;
      try {
        header = JSON.parse(headerJson);
        payload = JSON.parse(payloadJson);
      } catch {
        throw new BadRequestException('Invalid JWS JSON');
      }

      // alg check
      if (!header.alg || !ALLOWED_ALGS.has(header.alg)) {
        console.error(`AppleNotificationGuard: Unsupported alg: ${header.alg}`);
        throw new UnauthorizedException(`Unsupported alg: ${header.alg}`);
      }

      // x5c chain present?
      const x5c: string[] = header.x5c;
      if (!x5c || x5c.length < 1) {
        console.error('AppleNotificationGuard: Missing x5c certificate chain');
        throw new UnauthorizedException('Missing x5c certificate chain');
      }

      // Convert x5c to PEM/DER
      const leafDer = Buffer.from(x5c[0], 'base64');
      const leafPem = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
      const intermediateDer = x5c[1]
        ? Buffer.from(x5c[1], 'base64')
        : undefined;
      const rootDer = x5c[2] ? Buffer.from(x5c[2], 'base64') : undefined;

      // Optional but HIGHLY recommended: validate that the root in chain == Apple Root CA G3 fingerprint
      if (APPLE_ROOT_G3_SHA256 && rootDer) {
        const rootFp = certDerToSha256Hex(rootDer);
        if (rootFp !== APPLE_ROOT_G3_SHA256) {
          console.error(
            `AppleNotificationGuard: Apple root CA fingerprint mismatch: ${rootFp}`,
          );
          throw new UnauthorizedException('Apple root CA fingerprint mismatch');
        }
      }

      // Verify signature using the leaf certificate public key
      const verify = crypto.createVerify('RSA-SHA256'); // Node maps EC algs via named curves internally
      console.log('AppleNotificationGuard: Verifying JWS signature');
      verify.update(`${headerB64u}.${payloadB64u}`);
      console.log('AppleNotificationGuard: verifying with leafPem:', leafPem);
      verify.end();
      console.log('AppleNotificationGuard: signature (base64url):', sigB64u);
      const ok = verify.verify(leafPem, b64urlToBuffer(sigB64u));
      console.log('AppleNotificationGuard: signature valid:', ok);
      if (!ok) {
        console.error('AppleNotificationGuard: Invalid JWS signature');
        throw new UnauthorizedException('Invalid Apple JWS signature');
      }

      // Basic payload sanity checks
      // payload.notificationType / payload.subtype / payload.data.{bundleId,appAppleId}
      const bundleId = payload?.data?.bundleId;
      const appAppleId = payload?.data?.appAppleId;
      if (APP_BUNDLE_ID && bundleId && bundleId !== APP_BUNDLE_ID) {
        console.error(`AppleNotificationGuard: bundleId mismatch: ${bundleId}`);
        throw new UnauthorizedException(`bundleId mismatch: ${bundleId}`);
      }
      if (
        APP_APPLE_ID &&
        appAppleId &&
        String(appAppleId) !== String(APP_APPLE_ID)
      ) {
        console.error(
          `AppleNotificationGuard: appAppleId mismatch: ${appAppleId}`,
        );
        throw new UnauthorizedException(`appAppleId mismatch: ${appAppleId}`);
      }

      // attach decoded, validated payload for downstream use
      (req as any).appleNotification = payload;

      return true;
    } catch (err) {
      console.error(
        'AppleNotificationGuard: Exception during verification',
        err,
      );
      throw err;
    }
  }
}
