export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { email: string; purpose: 'login' | 'signup' };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Wallet: undefined;
  Discover: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  Main: undefined;
};
