import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
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

  const menuItems = [
    { icon: '🔄', label: 'Your Refunds' },
    { icon: '❤️', label: 'Your Wishlist' },
    { icon: '💳', label: 'E-Gift Cards' },
    { icon: '💬', label: 'Help & Support' },
    { icon: '📍', label: 'Saved Addresses', sub: '3 Addresses' },
    { icon: '👤', label: 'Profile' },
    { icon: '🎁', label: 'Rewards' },
  ];

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
             <Text style={styles.avatarLetter}>
               {(user?.email || user?.phoneNumber || 'S').charAt(0).toUpperCase()}
             </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.displayName || 'sayooj'}</Text>
            <Text style={styles.userPhone}>{user?.phoneNumber || '62385 28166'}</Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={styles.gridIconBg}><Text style={styles.gridIcon}>🛍️</Text></View>
            <Text style={styles.gridLabel}>Your{"\n"}Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={styles.gridIconBg}><Text style={styles.gridIcon}>💬</Text></View>
            <Text style={styles.gridLabel}>Help &{"\n"}Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={styles.gridIconBg}><Text style={styles.gridIcon}>❤️</Text></View>
            <Text style={styles.gridLabel}>Your{"\n"}Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <Text style={styles.walletIcon}>💳</Text>
              <Text style={styles.walletTitle}>Zepto Cash & Gift Card</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletBody}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>₹0</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add Balance</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Info List */}
        <Text style={styles.listTitle}>Your Information</Text>
        <View style={styles.listContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.label} 
              style={[styles.listItem, index === menuItems.length - 1 && styles.lastItem]}
            >
              <View style={styles.listIconBg}><Text style={styles.listIcon}>{item.icon}</Text></View>
              <View style={styles.listContent}>
                <Text style={styles.listLabel}>{item.label}</Text>
                {item.sub && <Text style={styles.listSub}>{item.sub}</Text>}
              </View>
              <Text style={styles.listChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪 Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f6fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee',
    marginRight: 16,
  },
  backIcon: { fontSize: 24, fontWeight: '300', color: '#000', marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scroll: { flex: 1 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#9c33ff', // Premium purple
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 2 },
  userPhone: { fontSize: 13, color: '#666', fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#eee',
  },
  gridIconBg: { marginBottom: 8 },
  gridIcon: { fontSize: 24 },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 16 },
  walletCard: {
    backgroundColor: '#f8f4ff',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1, borderColor: '#e9e0ff',
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  walletTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletIcon: { fontSize: 18 },
  walletTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  chevron: { fontSize: 20, color: '#9c33ff' },
  walletDivider: { height: 1, backgroundColor: '#e9e0ff', opacity: 0.5, marginBottom: 12, borderStyle: 'dashed', borderWidth: 1, borderRadius: 1 },
  walletBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  balanceValue: { fontSize: 20, fontWeight: '800', color: '#000' },
  addBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd',
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#000', marginHorizontal: 20, marginTop: 10, marginBottom: 16 },
  listContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#eee',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  lastItem: { borderBottomWidth: 0 },
  listIconBg: { marginRight: 16 },
  listIcon: { fontSize: 20 },
  listContent: { flex: 1 },
  listLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  listSub: { fontSize: 11, color: '#999', marginTop: 2 },
  listChevron: { fontSize: 18, color: '#ccc' },
  signOutBtn: {
    margin: 20,
    padding: 18,
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)',
  },
  signOutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
});
