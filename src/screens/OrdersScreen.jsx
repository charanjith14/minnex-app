import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLORS } from '../constants';

const STATUS_STEPS = [
  'order placed', 'restaurant accepted', 'preparing',
  'agent assigned', 'picked up', 'on the way', 'delivered',
];

const STATUS_COPY = {
  'order placed': 'Payment confirmed. Waiting at the restaurant.',
  preparing: 'Restaurant is preparing your food.',
  'agent assigned': 'A delivery partner has accepted the pickup.',
  'picked up': 'The delivery partner picked up the order.',
  'on the way': 'Your order is on the way!',
  delivered: 'Delivered successfully! Enjoy your meal 🎉',
};

export default function OrdersScreen({ user }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, snapshot => {
      const orders = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setOrder(orders[0] || null);
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>Tracking paused</Text>
      <Text style={styles.emptySub}>{error}</Text>
    </View>
  );

  if (!order) return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>No active orders</Text>
      <Text style={styles.emptySub}>Your latest Minnex order will appear here.</Text>
    </View>
  );

  const normalizedStatus = order.status || 'order placed';
  const activeStep = Math.max(0, STATUS_STEPS.indexOf(normalizedStatus));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {/* Summary card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.eyebrow}>Current order</Text>
            <Text style={styles.shopName}>{order.shopName}</Text>
            <Text style={styles.statusCopy}>
              {STATUS_COPY[normalizedStatus] || 'Status updates will appear here.'}
            </Text>
            {order.agentName && <Text style={styles.agentText}>Partner: {order.agentName}</Text>}
          </View>
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>₹{order.price}</Text>
          </View>
        </View>
      </View>

      {/* Progress stepper */}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Order progress</Text>
        {STATUS_STEPS.map((step, i) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepDot, i <= activeStep && styles.stepDotActive]} />
            <Text style={[styles.stepLabel, i <= activeStep && styles.stepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Payment */}
      {!order.paid && (
        <TouchableOpacity style={styles.payBtn} onPress={() => Alert.alert('Payment', 'Payment integration coming soon!')}>
          <Text style={styles.payBtnText}>Pay ₹{order.price}</Text>
        </TouchableOpacity>
      )}

      {/* Bill breakdown */}
      {order.billing && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Bill breakdown</Text>
          {[
            ['Food', order.billing.subtotal],
            ['Delivery fee', order.billing.deliveryFee],
            ['Platform fee', order.billing.platformFee],
            ['Tip', order.billing.tip],
            ['Total', order.billing.customerTotal || order.price],
          ].filter(([, v]) => v !== undefined).map(([label, val]) => (
            <View key={label} style={styles.billRow}>
              <Text style={styles.billLabel}>{label}</Text>
              <Text style={styles.billValue}>₹{val}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  shopName: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  statusCopy: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  agentText: { fontSize: 13, color: COLORS.green, marginTop: 6, fontWeight: '600' },
  pricePill: { backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  priceText: { color: COLORS.primary, fontWeight: '800', fontSize: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginRight: 14 },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 14, color: COLORS.textSecondary, textTransform: 'capitalize' },
  stepLabelActive: { color: COLORS.text, fontWeight: '700' },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  billLabel: { color: COLORS.textSecondary, fontSize: 14 },
  billValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
});
