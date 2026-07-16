import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants';
import { createOrder } from '../utils/orders';
import { triggerHaptic } from '../utils/haptics';

const DELIVERY_FEE = 20;
const PLATFORM_FEE = 5;
const TIP_OPTIONS = [0, 10, 20, 50];

export default function CartScreen({ route, navigation, user }) {
  const { cartItems } = route.params;

  const [name, setName] = useState(
    user?.displayName || user?.email?.split('@')[0] || ''
  );
  const [phone, setPhone] = useState(
    user?.phoneNumber?.replace('+91', '') || ''
  );
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState(0);
  const [loading, setLoading] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, { shop, qty }) => sum + shop.price * qty, 0
  );
  const customerTotal = subtotal + DELIVERY_FEE + PLATFORM_FEE + tip;

  const handlePlaceOrder = async () => {
    triggerHaptic('impactMedium');

    if (!name.trim()) {
      Alert.alert('Missing details', 'Please enter your name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Missing details', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Missing details', 'Please enter your delivery address.');
      return;
    }

    setLoading(true);
    try {
      const firstShop = cartItems[0].shop;
      const allItems = cartItems.map(({ shop, qty }) => ({
        id: shop.item.id,
        name: shop.item.name,
        description: shop.item.description || '',
        price: shop.price,
        quantity: qty,
        total: shop.price * qty,
        shopId: shop.id,
        shopName: shop.name,
      }));

      const deliveryDetails = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        location: null,
        noContact: false,
        groupOrder: false,
        scheduleSlot: 'ASAP',
        deliveryMode: 'Food delivery',
        priorityMatch: false,
      };

      const totalQty = cartItems.reduce((sum, { qty }) => sum + qty, 0);
      const commission = Math.round(subtotal * 0.2);
      const distancePay = Math.round(firstShop.distanceKm * 5);

      const bill = {
        subtotal,
        deliveryFee: DELIVERY_FEE,
        platformFee: PLATFORM_FEE,
        tip,
        customerTotal,
        quantity: totalQty,
        items: allItems,
        distanceKm: firstShop.distanceKm,
        commissionRate: 0.2,
        restaurantCommission: commission,
        restaurantSettlement: subtotal - commission,
        agentBasePay: 30,
        distancePay,
        surgePay: 0,
        agentTotal: 30 + distancePay + tip,
        platformRevenue: PLATFORM_FEE + commission,
      };

      await createOrder(user, firstShop, deliveryDetails, { mode: 'demo' }, bill);

      triggerHaptic('notificationSuccess');
      Alert.alert(
        '🎉 Order Placed!',
        'Your order is confirmed. Track it in the Orders tab.',
        [{
          text: 'View Order',
          onPress: () => {
            navigation.goBack();
            navigation.getParent()?.navigate('Orders');
          },
        }]
      );
    } catch (err) {
      triggerHaptic('notificationError');
      Alert.alert('Order failed', err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>
            {cartItems.reduce((s, { qty }) => s + qty, 0)} items
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cart Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map(({ shop, qty }) => (
            <View key={shop.id} style={styles.itemRow}>
              <View style={styles.itemVegDot}>
                <View style={styles.vegInner} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {shop.item.name}
                </Text>
                <Text style={styles.itemShop}>{shop.name}</Text>
              </View>
              <View style={styles.itemRight}>
                <View style={styles.itemQtyPill}>
                  <Text style={styles.itemQtyText}>×{qty}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{shop.price * qty}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Delivery Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+91</Text>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Flat no., Building, Street, Area"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.label}>Delivery Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Ring the bell, Leave at door"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* ── Tip ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip for Delivery Partner 🛵</Text>
          <Text style={styles.tipHint}>100% goes to your delivery partner</Text>
          <View style={styles.tipRow}>
            {TIP_OPTIONS.map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.tipBtn, tip === amount && styles.tipBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setTip(amount);
                }}
              >
                <Text style={[styles.tipBtnText, tip === amount && styles.tipBtnTextActive]}>
                  {amount === 0 ? 'None' : `₹${amount}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Bill Breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={styles.billValue}>₹{DELIVERY_FEE}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform fee</Text>
            <Text style={styles.billValue}>₹{PLATFORM_FEE}</Text>
          </View>
          {tip > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tip</Text>
              <Text style={styles.billValue}>₹{tip}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.billTotalRow]}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>₹{customerTotal}</Text>
          </View>
        </View>

        {/* ── Payment Mode ── */}
        <View style={styles.paymentNote}>
          <Text style={styles.paymentNoteIcon}>💵</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentNoteTitle}>Cash on Delivery</Text>
            <Text style={styles.paymentNoteText}>Pay ₹{customerTotal} when the order arrives</Text>
          </View>
          <View style={styles.selectedDot} />
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Place Order Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, loading && styles.placeBtnLoading]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View>
                <Text style={styles.placeBtnLabel}>Place Order</Text>
                <Text style={styles.placeBtnSub}>Cash on delivery</Text>
              </View>
              <Text style={styles.placeBtnPrice}>₹{customerTotal} →</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.soft,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginRight: 12,
  },
  backIcon: { fontSize: 26, fontWeight: '300', color: COLORS.primary, marginTop: -3 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.primary },
  itemCountBadge: {
    backgroundColor: COLORS.zeptoPurpleLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  itemCountText: { fontSize: 13, fontWeight: '800', color: COLORS.zeptoPurple },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '900', color: COLORS.primary,
    marginBottom: 14, letterSpacing: -0.3,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemVegDot: {
    width: 16, height: 16, borderRadius: 2,
    borderWidth: 1.5, borderColor: COLORS.green,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, flexShrink: 0,
  },
  vegInner: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.primary, lineHeight: 20 },
  itemShop: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemQtyPill: {
    backgroundColor: COLORS.zeptoPurpleLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  itemQtyText: { fontSize: 13, fontWeight: '800', color: COLORS.zeptoPurple },
  itemTotal: { fontSize: 16, fontWeight: '800', color: COLORS.primary, minWidth: 48, textAlign: 'right' },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: '800', color: COLORS.textSecondary,
    marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.bg, color: COLORS.primary,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontWeight: '500', borderWidth: 1, borderColor: COLORS.border,
  },
  addressInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phonePrefix: {
    backgroundColor: COLORS.bg, color: COLORS.textSecondary,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: COLORS.border,
  },
  phoneInput: { flex: 1 },

  tipHint: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 12, marginTop: -8 },
  tipRow: { flexDirection: 'row', gap: 10 },
  tipBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  tipBtnActive: { backgroundColor: COLORS.zeptoPurpleLight, borderColor: COLORS.zeptoPurple },
  tipBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  tipBtnTextActive: { color: COLORS.zeptoPurple },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  billLabel: { fontSize: 14, color: COLORS.textSecondary },
  billValue: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  billTotalRow: {
    marginTop: 10, paddingTop: 14,
    borderTopWidth: 2, borderTopColor: COLORS.border,
  },
  billTotalLabel: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  billTotalValue: { fontSize: 19, fontWeight: '900', color: COLORS.primary },

  paymentNote: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.greenLight,
    borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(26,181,99,0.2)',
  },
  paymentNoteIcon: { fontSize: 22 },
  paymentNoteTitle: { fontSize: 15, fontWeight: '800', color: COLORS.green, marginBottom: 2 },
  paymentNoteText: { fontSize: 13, color: COLORS.green, fontWeight: '500' },
  selectedDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.green, borderWidth: 3,
    borderColor: 'rgba(26,181,99,0.3)',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16, paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.floating,
  },
  placeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  placeBtnLoading: { justifyContent: 'center' },
  placeBtnLabel: { color: '#fff', fontSize: 17, fontWeight: '900' },
  placeBtnSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  placeBtnPrice: { color: '#fff', fontSize: 18, fontWeight: '900' },
});
