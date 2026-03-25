import { buildQrPayload, verifyQrPayload, parseQrPayloadFields } from './qr-payload';

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

    it('embeds a jti (UUID) in the payload', () => {
      const out = buildQrPayload('cust-uuid', SECRET, INTERVAL_SEC);
      const parsed = parseQrPayloadFields(out.qrToken);
      expect(parsed).not.toBeNull();
      expect(parsed!.j).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('generates a unique jti on every call (no static reuse)', () => {
      const a = buildQrPayload('cust-uuid', SECRET, INTERVAL_SEC);
      const b = buildQrPayload('cust-uuid', SECRET, INTERVAL_SEC);
      const parsedA = parseQrPayloadFields(a.qrToken);
      const parsedB = parseQrPayloadFields(b.qrToken);
      expect(parsedA!.j).not.toEqual(parsedB!.j);
    });
  });

  describe('verifyQrPayload', () => {
    it('valid QR returns customerId and jti', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC);
      expect('error' in r).toBe(false);
      const ok = r as { customerId: string; jti: string };
      expect(ok.customerId).toBe('cust-123');
      expect(ok.jti).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('jti from verify matches jti in payload', () => {
      const { qrToken } = buildQrPayload('cust-123', SECRET, INTERVAL_SEC);
      const parsed = parseQrPayloadFields(qrToken)!;
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC) as { customerId: string; jti: string };
      expect(r.jti).toBe(parsed.j);
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

    it('token without jti field is rejected', () => {
      // Simulate old token format (no j field)
      const crypto = require('crypto');
      const payload = JSON.stringify({ c: 'cust-old', b: 999999, e: Date.now() + 60000 });
      const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
      const b64 = Buffer.from(payload).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const oldToken = b64 + '.' + sig;
      const r = verifyQrPayload(oldToken, SECRET, INTERVAL_SEC);
      expect('error' in r).toBe(true);
      expect((r as { error: string }).error).toMatch(/Invalid QR payload fields/);
    });

    it('allows +/-1 bucket skew', () => {
      const base = Math.floor(Date.now() / 1000);
      const bucket = Math.floor(base / INTERVAL_SEC);
      const expiresAtMs = (bucket + 1) * INTERVAL_SEC * 1000;
      const crypto = require('crypto');
      const jti = '00000000-0000-4000-8000-000000000001';
      const payloadStr = JSON.stringify({ c: 'cust-456', b: bucket - 1, e: expiresAtMs, j: jti });
      const sig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex');
      const b64 = Buffer.from(payloadStr, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const qrToken = b64 + '.' + sig;
      const nowMs = (base - 5) * 1000;
      const r = verifyQrPayload(qrToken, SECRET, INTERVAL_SEC, nowMs);
      expect(r).toMatchObject({ customerId: 'cust-456', jti });
    });

    it('empty or malformed token returns error', () => {
      expect(verifyQrPayload('', SECRET, INTERVAL_SEC)).toMatchObject({ error: expect.any(String) });
      expect(verifyQrPayload('no-dot', SECRET, INTERVAL_SEC)).toMatchObject({
        error: expect.any(String),
      });
    });
  });
});
