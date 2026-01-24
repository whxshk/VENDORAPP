import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { customersApi } from '../api/client';

const DEFAULT_REFRESH_MS = 30000;

export default function QrScreen() {
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [error, setError] = useState('');
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshMsRef = useRef(DEFAULT_REFRESH_MS);

  const loadQrToken = useCallback(async () => {
    try {
      const response = await customersApi.getQrToken();
      const data = response.data as { qrPayload?: string; refreshIntervalSec?: number };
      const payload = data.qrPayload ?? (response.data as any).qrToken;
      const sec = typeof data.refreshIntervalSec === 'number' ? data.refreshIntervalSec : 30;
      const ms = Math.max(5000, sec * 1000);
      refreshMsRef.current = ms;
      setQrPayload(payload ?? null);
      setError('');
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(loadQrToken, ms);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load QR token');
    }
  }, []);

  useEffect(() => {
    loadQrToken();
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [loadQrToken]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      {qrPayload ? (
        <QRCode value={qrPayload} size={200} />
      ) : (
        <Text>{error || 'Loading...'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
