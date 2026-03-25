/**
 * QR payload spec (Design 2): base64url(JSON) + '.' + hex(HMAC-SHA256).
 * Fields: c (customerId), b (bucket), e (expiresAt Unix ms), j (jti UUID).
 *
 * j (jti) is a random UUID generated fresh for every token issuance.
 * The backend enforces single-use: once a jti is consumed (scan succeeded),
 * it is stored in UsedQrToken and all future attempts with the same jti are rejected.
 * +/-1 bucket skew is still allowed for clock drift.
 */

import * as crypto from 'crypto';

export interface QrPayloadFields {
  c: string;  // customerId
  b: number;  // bucket (time window index)
  e: number;  // expiresAt Unix ms
  j: string;  // jti: unique random UUID per issuance
}

function base64UrlEncode(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(b64: string): string {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return Buffer.from(s, 'base64').toString('utf8');
}

/**
 * Parse payload part only (no HMAC verify).
 * Used to extract customerId + jti for DB lookups before full verification.
 */
export function parseQrPayloadFields(qrToken: string): QrPayloadFields | null {
  if (!qrToken || typeof qrToken !== 'string') return null;
  const dot = qrToken.indexOf('.');
  if (dot === -1) return null;
  const payloadB64 = qrToken.slice(0, dot);
  if (!payloadB64) return null;
  try {
    const payloadStr = base64UrlDecode(payloadB64);
    const parsed = JSON.parse(payloadStr) as QrPayloadFields;
    if (
      !parsed.c ||
      typeof parsed.b !== 'number' ||
      typeof parsed.e !== 'number' ||
      !parsed.j ||
      typeof parsed.j !== 'string'
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Build a QR token for a customer.
 * Generates a fresh jti (UUID) on every call — each token is unique and single-use.
 */
export function buildQrPayload(
  customerId: string,
  secret: string,
  rotationIntervalSec: number = 60,
): { qrToken: string; expiresAt: number; refreshIntervalSec: number } {
  const interval = Math.max(1, rotationIntervalSec);
  const nowSec = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(nowSec / interval);
  const expiresAtMs = (bucket + 2) * interval * 1000;
  const jti = crypto.randomUUID();
  const payload: QrPayloadFields = { c: customerId, b: bucket, e: expiresAtMs, j: jti };
  const payloadStr = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  const qrToken = base64UrlEncode(payloadStr) + '.' + sig;
  return {
    qrToken,
    expiresAt: expiresAtMs,
    refreshIntervalSec: interval,
  };
}

/**
 * Verify a QR token. Allows +/-1 bucket skew for clock drift.
 * On success returns { customerId, jti }.
 * Caller MUST then atomically consume the jti in UsedQrToken to enforce single-use.
 */
export function verifyQrPayload(
  qrToken: string,
  secret: string,
  rotationIntervalSec: number,
  nowMs?: number,
): { customerId: string; jti: string } | { error: string } {
  const now = nowMs ?? Date.now();
  if (!qrToken || typeof qrToken !== 'string') return { error: 'Invalid or missing QR payload' };
  const dot = qrToken.indexOf('.');
  if (dot === -1) return { error: 'Invalid QR format' };
  const payloadB64 = qrToken.slice(0, dot);
  const sigHex = qrToken.slice(dot + 1);
  if (!payloadB64 || !sigHex) return { error: 'Invalid QR format' };

  let payloadStr: string;
  let parsed: QrPayloadFields;
  try {
    payloadStr = base64UrlDecode(payloadB64);
    parsed = JSON.parse(payloadStr) as QrPayloadFields;
  } catch {
    return { error: 'Invalid or tampered QR payload' };
  }

  const { c: customerId, b: bucket, e: expiresAt, j: jti } = parsed;
  if (
    !customerId ||
    typeof bucket !== 'number' ||
    typeof expiresAt !== 'number' ||
    !jti ||
    typeof jti !== 'string'
  )
    return { error: 'Invalid QR payload fields' };

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sigHex, 'hex');
  } catch {
    return { error: 'Invalid or tampered QR' };
  }
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf))
    return { error: 'Invalid or tampered QR' };

  const interval = Math.max(1, rotationIntervalSec);
  const nowSec = Math.floor(now / 1000);
  const currentBucket = Math.floor(nowSec / interval);
  if (bucket < currentBucket - 1 || bucket > currentBucket + 1)
    return { error: 'QR expired or invalid time window' };
  if (now > expiresAt) return { error: 'QR expired' };

  return { customerId, jti };
}
