import { buildQrPayload, verifyQrPayload } from './qr-payload';

const SECRET = 'test-secret';
const INTERVAL_SEC = 30;

describe('qr-payload', () => {
  describe('buildQrPayload', () => {
    it('returns qrToken, expiresAt, refreshIntervalSec', () => {
      const out = buildQrPayload('cust-uuid', SECRET, INTERVAL_SEC);
      expect(out.qrToken).toMatch(/^[A-Za-z0-9_-]+\.[a-f0-9]+$/);
      expect(typeof out.expiresAt).toBe('number');
      expect(out.refreshIntervalSec).toBe(INTERVAL_SEC);
    });
  });

  describe('verifyQrPayload', () => {
    it('valid QR returns customerId', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC);
      expect(r).toEqual({ customerId: 'cust-123' });
    });

    it('expired QR returns error', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const future = Date.now() + (INTERVAL_SEC * 3 + 10) * 1000;
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC, future);
      expect('error' in r).toBe(true);
      expect((r as { error: string }).error).toMatch(/expired|invalid time/);
    });

    it('tampered QR returns error', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const [payloadB64, sig] = qrToken.split('.');
      const tampered = payloadB64.slice(0, -2) + 'xx.' + sig;
      const r = verifyQrPayload(tampered, SECRET, INTERVAL_SEC);
      expect('error' in r).toBe(true);
      expect((r as { error: string }).error).toMatch(/Invalid|tampered/);
    });

    it('wrong secret returns error', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const r = verifyQrPayload(qrToken, 'wrong-secret', INTERVAL_SEC);
      expect('error' in r).toBe(true);
      expect((r as { error: string }).error).toMatch(/Invalid|tampered/);
    });

    it('allows ±1 bucket skew', () => {
      const base = Math.floor(Date.now() / 1000);
      const bucket = Math.floor(base / INTERVAL_SEC);
      const expiresAtMs = (bucket + 1) * INTERVAL_SEC * 1000;
      const payloadStr = JSON.stringify({
        c: 'cust-456',
        b: bucket - 1,
        e: expiresAtMs,
      });
      const crypto = require('crypto');
      const sig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex');
      const b64 = Buffer.from(payloadStr, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const qrToken = b64 + '.' + sig;
      const nowMs = (base - 5) * 1000;
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC, nowMs);
      expect(r).toEqual({ customerId: 'cust-456' });
    });

    it('empty or malformed token returns error', () => {
      expect(verifyQrPayload('', SECRET, INTERVAL_SEC)).toMatchObject({ error: expect.any(String) });
      expect(verifyQrPayload('no-dot', SECRET, INTERVAL_SEC)).toMatchObject({
        error: expect.any(String),
      });
    });
  });
});
