import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase/config';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        setUser(currentUser);
        setAuthError(null);
        setLoading(false);
      },
      error => {
        console.error('Firebase auth startup failed:', error);
        setAuthError(error?.message || 'Unable to initialize sign in.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.splash}>
        <Text style={styles.errorTitle}>Unable to start Minnex</Text>
        <Text style={styles.errorText}>{authError}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator user={user} /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  errorTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  errorText: { color: COLORS.textSecondary, fontSize: 14, paddingHorizontal: 24, textAlign: 'center' },
});
