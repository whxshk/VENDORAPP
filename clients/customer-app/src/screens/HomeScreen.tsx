import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Mock customer data
const mockCustomer = {
  id: 'customer-1',
  name: 'John Doe',
  qrCode: 'QR-0001',
  pointsBalance: 850,
};

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SharkBand</Text>
        <Text style={styles.subtitle}>Your Loyalty Card</Text>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Scan to Earn Points</Text>
        <View style={styles.qrContainer}>
          <QRCode value={mockCustomer.qrCode} size={200} />
        </View>
        <Text style={styles.qrCode}>{mockCustomer.qrCode}</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Your Points Balance</Text>
        <Text style={styles.pointsValue}>{mockCustomer.pointsBalance}</Text>
        <Text style={styles.pointsSubtext}>pts</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          • Show your QR code at participating merchants{'\n'}
          • Earn points with every purchase{'\n'}
          • Redeem points for rewards
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1829',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(241, 245, 249, 0.8)',
  },
  qrCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCode: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.6)',
    fontFamily: 'monospace',
  },
  pointsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.6)',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  pointsSubtext: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.6)',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.8)',
    lineHeight: 24,
  },
});
