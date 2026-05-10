import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { COLORS } from '../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
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
    } catch (err) {
      Alert.alert('Error', err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.logoWord}>MINNEX</Text>
          <Text style={styles.tagline}>India's Smart Delivery Network</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isSignup ? 'Create Account' : 'Welcome back'}</Text>
          <Text style={styles.cardSub}>Fresh orders. Live movement. One clean checkout.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{isSignup ? 'Sign Up' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoMark: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoLetter: { fontSize: 36, fontWeight: '900', color: '#fff' },
  logoWord: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 4 },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.surfaceAlt, color: COLORS.text, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
