/**
 * QR payload spec (Design 1): base64url(JSON) + '.' + hex(HMAC-SHA256).
 * Fields: c (customerId), b (bucket), e (expiresAt Unix ms).
 * ±1 bucket skew for validation.
 */

import * as crypto from 'crypto';

export interface QrPayloadFields {
  c: string;
  b: number;
  e: number;
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
 * Build a Design 1 qrToken for a customer.
 * @param customerId - UUID
 * @param secret - Customer.qrTokenSecret
 * @param rotationIntervalSec - Customer.rotationIntervalSec (default 120)
 */
export function buildQrPayload(
  customerId: string,
  secret: string,
  rotationIntervalSec: number = 120,
): { qrToken: string; expiresAt: number; refreshIntervalSec: number } {
  const interval = Math.max(1, rotationIntervalSec);
  const nowSec = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(nowSec / interval);
  const expiresAtMs = (bucket + 1) * interval * 1000;
  const payload: QrPayloadFields = { c: customerId, b: bucket, e: expiresAtMs };
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
 * Verify Design 1 qrToken. Allows ±1 bucket skew.
 * @param qrToken - Full token string
 * @param secret - Customer.qrTokenSecret
 * @param rotationIntervalSec - Customer.rotationIntervalSec
 * @param nowMs - Override for tests (default: Date.now())
 */
export function verifyQrPayload(
  qrToken: string,
  secret: string,
  rotationIntervalSec: number,
  nowMs?: number,
): { customerId: string } | { error: string } {
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

  const { c: customerId, b: bucket, e: expiresAt } = parsed;
  if (!customerId || typeof bucket !== 'number' || typeof expiresAt !== 'number')
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

  return { customerId };
}
