import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Mock rewards data
const mockRewards = [
  { id: '1', name: 'Free Latte', pointsCost: 200, description: 'Get a free latte' },
  { id: '2', name: 'Free Pastry', pointsCost: 150, description: 'Complimentary pastry' },
  { id: '3', name: '10% Discount', pointsCost: 100, description: '10% off your purchase' },
];

const mockPointsBalance = 850;

export default function RewardsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Rewards</Text>
        <Text style={styles.subtitle}>Your balance: {mockPointsBalance} pts</Text>
      </View>

      {mockRewards.map((reward) => {
        const canAfford = mockPointsBalance >= reward.pointsCost;
        return (
          <View
            key={reward.id}
            style={[
              styles.rewardCard,
              !canAfford && styles.rewardCardDisabled,
            ]}
          >
            <View style={styles.rewardContent}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
            </View>
            <View style={styles.rewardPoints}>
              <Text style={styles.pointsValue}>{reward.pointsCost}</Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
        );
      })}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(241, 245, 249, 0.8)',
  },
  rewardCard: {
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
  rewardCardDisabled: {
    opacity: 0.5,
  },
  rewardContent: {
    flex: 1,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: 'rgba(241, 245, 249, 0.6)',
  },
  rewardPoints: {
    alignItems: 'center',
    marginLeft: 16,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  pointsLabel: {
    fontSize: 12,
    color: 'rgba(241, 245, 249, 0.6)',
  },
});
