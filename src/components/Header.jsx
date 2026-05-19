import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS, SHADOWS } from '../constants';
import { triggerHaptic } from '../utils/haptics';

export default function Header({ user, balance = 0, onProfilePress, onWalletPress }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Section: Location and Profile */}
        <View style={styles.topRow}>
          <View style={styles.locationContainer}>
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryBadgeText}>⚡ 6 mins</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                Home - 706, E-4, Akshaya Today Block-...
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </View>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.walletWidget} 
              onPress={() => { triggerHaptic('impactLight'); onWalletPress?.(); }}
            >
              <Text style={styles.walletIcon}>👛</Text>
              <Text style={styles.balanceText}>₹{balance}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileBtn} 
              onPress={() => { triggerHaptic('impactLight'); onProfilePress?.(); }}
            >
              <View style={styles.profileAvatar}>
                 <Text style={styles.avatarLetter}>
                   {(user?.email || user?.phoneNumber || 'U').charAt(0).toUpperCase()}
                 </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  container: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flex: 1,
    marginRight: 16,
  },
  deliveryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.zeptoPurpleLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  deliveryBadgeText: {
    color: COLORS.zeptoPurple,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    maxWidth: '90%',
  },
  dropdownIcon: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 6,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  walletIcon: {
    fontSize: 14,
  },
  balanceText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.zeptoPurple,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
