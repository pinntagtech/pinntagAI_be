import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as crypto from 'crypto';

export function generateAppleJWT(): string {
  // Load your Apple API credentials from config or environment
  const privateKey = fs.readFileSync(
    process.env.APPLE_PRIVATE_KEY_PATH,
    'utf8',
  );
  // ^ This is the *.p8 key file downloaded from App Store Connect (never expose this publicly)
  const issuerId = process.env.APPLE_ISSUER_ID; // Your 10-character App Store Connect issuer ID
  const keyId = process.env.APPLE_KEY_ID; // Your Apple key ID for the p8 file
  const bundleId = process.env.APP_BUNDLE_ID; // Your app's bundle ID

  if (!privateKey || !issuerId || !keyId || !bundleId) {
    throw new Error('Missing Apple IAP configuration in environment variables');
  }

  // Prepare JWT claims
  const nowUnix = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: nowUnix,
    exp: nowUnix + 20 * 60, // Token expiration (e.g. 20 minutes from now)
    aud: 'appstoreconnect-v1', // Audience is Apple's App Store Connect API:contentReference[oaicite:7]{index=7},
    bid: bundleId, // Your app's bundle ID
  };
  const headers = {
    alg: 'ES256', // Elliptic curve signing (Apple requires ES256)
    kid: keyId,
    typ: 'JWT',
  };

  // Sign the JWT with ES256 using your private key
  return jwt.sign(payload, privateKey, { algorithm: 'ES256', header: headers });
}

function b64urlToBuf(s: string) {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

// Convert 64-byte raw (r|s) to DER SEQUENCE(INTEGER r, INTEGER s)
function es256RawToDer(sig: Buffer): Buffer {
  if (sig.length !== 64) throw new Error('ES256 signature must be 64 bytes');
  const r = sig.slice(0, 32);
  const s = sig.slice(32);

  const trim = (b: Buffer) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0x00) i++;
    let v = b.slice(i);
    // if high bit set, prefix with 0x00 per INTEGER rules
    return v[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), v]) : v;
  };

  const rT = trim(r),
    sT = trim(s);
  const rSeq = Buffer.concat([Buffer.from([0x02, rT.length]), rT]);
  const sSeq = Buffer.concat([Buffer.from([0x02, sT.length]), sT]);
  const seq = Buffer.concat([
    Buffer.from([0x30, rSeq.length + sSeq.length]),
    rSeq,
    sSeq,
  ]);
  return seq;
}

export function verifyAppleJws(jws: string): boolean {
  try {
    const [headerB64u, payloadB64u, sigB64u] = jws.split('.');
    if (!headerB64u || !payloadB64u || !sigB64u) return false;

    const headerJson = JSON.parse(b64urlToBuf(headerB64u).toString('utf8'));
    if (
      headerJson.alg !== 'ES256' ||
      !Array.isArray(headerJson.x5c) ||
      headerJson.x5c.length === 0
    ) {
      return false;
    }

    const leafPem =
      '-----BEGIN CERTIFICATE-----\n' +
      headerJson.x5c[0] +
      '\n-----END CERTIFICATE-----';

    // JWS uses raw r|s; Node expects DER
    const sigDer = es256RawToDer(b64urlToBuf(sigB64u));
    const verifier = crypto.createVerify('SHA256');
    verifier.update(`${headerB64u}.${payloadB64u}`);
    verifier.end();

    return verifier.verify(leafPem, sigDer);
  } catch {
    return false;
  }
}

// export function verifyAppleJws(jws: string): boolean {
//   const [headerB64, payloadB64, sigB64] = jws.split('.');
//   const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));
//   const x5c: string[] = header?.x5c;
//   if (!x5c || x5c.length === 0) return false;

//   const leafPem = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
//   const verifier = crypto.createVerify('SHA256');
//   verifier.update(`${headerB64}.${payloadB64}`);
//   verifier.end();
//   const sig = Buffer.from(
//     sigB64.replace(/-/g, '+').replace(/_/g, '/'),
//     'base64',
//   );
//   return verifier.verify(leafPem, sig);
// }
