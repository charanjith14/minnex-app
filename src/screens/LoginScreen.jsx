import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { COLORS, SHADOWS } from '../constants';
import { triggerHaptic } from '../utils/haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    triggerHaptic('impactMedium');
    if (!email.trim() || !password.trim()) {
      triggerHaptic('notificationError');
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      }
      triggerHaptic('notificationSuccess');
    } catch (err) {
      triggerHaptic('notificationError');
      Alert.alert('Error', err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    triggerHaptic('impactLight');
    setIsSignup(!isSignup);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Premium Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.brandName}>MINNEX</Text>
          <Text style={styles.tagline}>Elevated Delivery Experience</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isSignup ? 'Create Account' : 'Welcome back'}</Text>
          <Text style={styles.cardSub}>Sign in to access your curated dashboard.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{isSignup ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account? Sign In' : "New to Minnex? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandBox: { alignItems: 'center', marginBottom: 48 },
  logoMark: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#fff' },
  brandName: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  tagline: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 32, padding: 32,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardTitle: { fontSize: 26, fontWeight: '900', color: COLORS.primary, marginBottom: 8, letterSpacing: -0.5 },
  cardSub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bg, color: COLORS.primary, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 18, fontSize: 17, fontWeight: '500',
    borderWidth: 1, borderColor: COLORS.border,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 12,
    ...SHADOWS.soft,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  toggle: { marginTop: 24, alignItems: 'center' },
  toggleText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
