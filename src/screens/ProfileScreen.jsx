import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { COLORS } from '../constants';

export default function ProfileScreen({ user }) {
  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {/* Avatar */}
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {(user?.email || user?.phoneNumber || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{user?.email || user?.phoneNumber || 'Minnex User'}</Text>
        <Text style={styles.uid}>UID: {(user?.uid || '').slice(0, 10)}…</Text>
      </View>

      {/* Info cards */}
      {[
        { icon: '📦', label: 'Orders', value: 'View your order history →' },
        { icon: '📍', label: 'Saved Addresses', value: 'Home, Work, Others →' },
        { icon: '💳', label: 'Payment Methods', value: 'UPI, Cards, Wallet →' },
        { icon: '🎁', label: 'Offers & Coupons', value: '3 offers available →' },
        { icon: '⚙️', label: 'Settings', value: 'Notifications, Privacy →' },
        { icon: '💬', label: 'Help & Support', value: 'AI-powered support →' },
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          style={styles.menuItem}
          onPress={() => Alert.alert(item.label, `${item.label} feature coming soon.`)}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuValue}>{item.value}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>🚪 Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Minnex v1.0.0 · Built with React Native</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 100 },
  avatarBox: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: '#fff' },
  displayName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  uid: { fontSize: 12, color: COLORS.textSecondary },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  menuValue: { fontSize: 12, color: COLORS.textSecondary },
  chevron: { fontSize: 22, color: COLORS.textSecondary },
  signOutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  signOutText: { color: '#f87171', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary },
});
