import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';
import { WalletIcon, CompassIcon, ClockIcon, UserIcon, QRNavIcon } from '../components/Icons';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const NAVY = '#0A1931';
const ORANGE = '#F97316';

type TabName = keyof MainTabParamList;

function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
  const color = focused ? NAVY : '#9CA3AF';
  const icons: Record<TabName, React.ReactElement> = {
    Wallet:   <WalletIcon  color={color} size={22} />,
    Discover: <CompassIcon color={color} size={22} />,
    Home:     <View />, // replaced by CenterButton
    Activity: <ClockIcon   color={color} size={22} />,
    Profile:  <UserIcon    color={color} size={22} />,
  };
  return icons[name];
}

/** Raised floating QR button for the center tab */
function CenterTabButton({ onPress, focused }: { onPress?: () => void; focused: boolean; children?: React.ReactNode }) {
  return (
    <TouchableOpacity
      style={styles.centerBtnWrapper}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Scan QR"
    >
      <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
        <QRNavIcon color="white" size={26} />
      </View>
      <Text style={[styles.centerLabel, { color: focused ? NAVY : '#9CA3AF' }]}>Scan</Text>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) =>
          route.name === 'Home' ? null : (
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {route.name}
            </Text>
          ),
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Wallet"   component={WalletScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarButton: (props) => (
            <CenterTabButton
              onPress={props.onPress ?? undefined}
              focused={props.accessibilityState?.selected ?? false}
            />
          ),
        }}
      />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"           component={LoginScreen} />
      <AuthStack.Screen name="Register"        component={RegisterScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingShark}>🦈</Text>
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth"    component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <RootStack.Screen name="Main"    component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    elevation: 0,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 3,
  },
  tabLabelActive: {
    color: NAVY,
    fontWeight: '700',
  },
  // Center QR button floats 22px above the nav bar
  centerBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -22,
    gap: 3,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  centerBtnActive: {
    backgroundColor: ORANGE,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  loading: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingShark: {
    fontSize: 64,
  },
});
