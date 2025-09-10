import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

export function generateAppleJWT(): string {
  // Load your Apple API credentials from config or environment
  const privateKey = fs.readFileSync(
    process.env.APPLE_PRIVATE_KEY_PATH,
    'utf8',
  );
  // ^ This is the *.p8 key file downloaded from App Store Connect (never expose this publicly)
  const issuerId = process.env.APPLE_ISSUER_ID; // Your 10-character App Store Connect issuer ID
  const keyId = process.env.APPLE_KEY_ID; // Your Apple key ID for the p8 file

  // Prepare JWT claims
  const nowUnix = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: nowUnix,
    exp: nowUnix + 20 * 60, // Token expiration (e.g. 20 minutes from now)
    aud: 'appstoreconnect-v1', // Audience is Apple's App Store Connect API:contentReference[oaicite:7]{index=7}
  };
  const headers = {
    alg: 'ES256', // Elliptic curve signing (Apple requires ES256)
    kid: keyId,
    typ: 'JWT',
  };

  // Sign the JWT with ES256 using your private key
  return jwt.sign(payload, privateKey, { algorithm: 'ES256', header: headers });
}
