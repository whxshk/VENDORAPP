import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Mock transaction history
const mockTransactions = [
  { id: '1', date: '2024-01-15', type: 'earn', points: 75, merchant: 'BrewLab Café' },
  { id: '2', date: '2024-01-14', type: 'redeem', points: -200, merchant: 'BrewLab Café', reward: 'Free Latte' },
  { id: '3', date: '2024-01-12', type: 'earn', points: 50, merchant: 'BrewLab Café' },
  { id: '4', date: '2024-01-10', type: 'earn', points: 100, merchant: 'BrewLab Café' },
];

export default function HistoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      {mockTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        mockTransactions.map((tx) => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionContent}>
              <Text style={styles.transactionDate}>{tx.date}</Text>
              <Text style={styles.transactionMerchant}>{tx.merchant}</Text>
              {tx.reward && (
                <Text style={styles.transactionReward}>{tx.reward}</Text>
              )}
            </View>
            <View style={styles.transactionPoints}>
              <Text
                style={[
                  styles.pointsValue,
                  tx.points > 0 ? styles.pointsEarned : styles.pointsRedeemed,
                ]}
              >
                {tx.points > 0 ? '+' : ''}
                {tx.points}
              </Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
        ))
      )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(241, 245, 249, 0.6)',
  },
  transactionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionContent: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: 'rgba(241, 245, 249, 0.6)',
    marginBottom: 4,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  transactionReward: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.8)',
  },
  transactionPoints: {
    alignItems: 'center',
    marginLeft: 16,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pointsEarned: {
    color: '#22c55e',
  },
  pointsRedeemed: {
    color: '#ef4444',
  },
  pointsLabel: {
    fontSize: 12,
    color: 'rgba(241, 245, 249, 0.6)',
  },
});
