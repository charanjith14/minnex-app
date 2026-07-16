import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { COLORS, SHADOWS } from '../constants';
import { triggerHaptic } from '../utils/haptics';

export default function ProfileScreen({ user }) {
  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Customer';

  const displayContact =
    user?.phoneNumber || user?.email || 'No contact on file';

  const avatarLetter =
    (user?.displayName || user?.email || user?.phoneNumber || 'C')
      .charAt(0)
      .toUpperCase();

  const handleSignOut = () => {
    triggerHaptic('impactMedium');
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('notificationSuccess');
          signOut(auth);
        },
      },
    ]);
  };

  const quickActions = [
    { icon: '🛍️', label: 'Your\nOrders' },
    { icon: '💬', label: 'Help &\nSupport' },
    { icon: '❤️', label: 'Your\nWishlist' },
  ];

  const menuItems = [
    { icon: '🔄', label: 'Your Refunds' },
    { icon: '❤️', label: 'Your Wishlist' },
    { icon: '💳', label: 'Minnex Gift Cards' },
    { icon: '💬', label: 'Help & Support' },
    { icon: '📍', label: 'Saved Addresses', sub: 'Manage addresses' },
    { icon: '👤', label: 'Account Details' },
    { icon: '🎁', label: 'Rewards & Referrals' },
  ];

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── User Info ── */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userContact}>{displayContact}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => triggerHaptic('impactLight')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Actions Grid ── */}
        <View style={styles.grid}>
          {quickActions.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => triggerHaptic('impactLight')}
            >
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Minnex Cash / Wallet ── */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => triggerHaptic('impactLight')}
        >
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <Text style={styles.walletIcon}>💳</Text>
              <Text style={styles.walletTitle}>Minnex Cash & Gift Card</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletBody}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>₹0.00</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => triggerHaptic('impactMedium')}
            >
              <Text style={styles.addBtnText}>+ Add Money</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* ── Menu List ── */}
        <Text style={styles.listTitle}>Your Account</Text>
        <View style={styles.listContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.listItem,
                index === menuItems.length - 1 && styles.lastItem,
              ]}
              onPress={() => triggerHaptic('impactLight')}
            >
              <View style={styles.listIconBg}>
                <Text style={styles.listIcon}>{item.icon}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listLabel}>{item.label}</Text>
                {item.sub && <Text style={styles.listSub}>{item.sub}</Text>}
              </View>
              <Text style={styles.listChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── App Version ── */}
        <Text style={styles.versionText}>Minnex v1.0 · Built with ♥</Text>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪  Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f6fb' },

  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  scroll: { flex: 1 },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.zeptoPurple,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
  userDetails: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 3 },
  userContact: { fontSize: 13, color: '#777', fontWeight: '500' },
  editBtn: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#eee',
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#333' },

  grid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18,
    paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#eee',
    ...SHADOWS.soft,
  },
  gridIcon: { fontSize: 26, marginBottom: 8 },
  gridLabel: {
    fontSize: 12, fontWeight: '700', color: '#333',
    textAlign: 'center', lineHeight: 17,
  },

  walletCard: {
    backgroundColor: '#f8f4ff',
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1, borderColor: '#e9e0ff',
    ...SHADOWS.soft,
  },
  walletHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  walletTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletIcon: { fontSize: 18 },
  walletTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  chevron: { fontSize: 22, color: COLORS.zeptoPurple },
  walletDivider: {
    height: 1, backgroundColor: '#e0d6f5',
    marginBottom: 14,
  },
  walletBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '500' },
  balanceValue: { fontSize: 22, fontWeight: '900', color: '#111' },
  addBtn: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1, borderColor: '#ddd',
  },
  addBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.zeptoPurple },

  listTitle: {
    fontSize: 17, fontWeight: '800', color: '#111',
    marginHorizontal: 20, marginBottom: 12,
  },
  listContainer: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#eee',
    ...SHADOWS.soft,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  lastItem: { borderBottomWidth: 0 },
  listIconBg: { marginRight: 14 },
  listIcon: { fontSize: 20 },
  listContent: { flex: 1 },
  listLabel: { fontSize: 15, fontWeight: '600', color: '#222' },
  listSub: { fontSize: 12, color: '#999', marginTop: 2 },
  listChevron: { fontSize: 20, color: '#ccc' },

  versionText: {
    textAlign: 'center', color: '#bbb', fontSize: 12,
    fontWeight: '500', marginTop: 24, marginBottom: 8,
  },

  signOutBtn: {
    margin: 16,
    padding: 18,
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)',
  },
  signOutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
});
