import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLORS, SHADOWS } from '../constants';

// ── Status constants ─────────────────────────────────────────────────────────
const STATUS_STEPS = [
  'order placed', 'restaurant accepted', 'preparing',
  'agent assigned', 'picked up', 'on the way', 'delivered',
];

const STATUS_COPY = {
  'order placed':       'Payment confirmed. Waiting at the restaurant.',
  'restaurant accepted':'Restaurant accepted and started preparing.',
  preparing:            'Restaurant is preparing your food.',
  'agent assigned':     'A delivery partner has accepted the pickup.',
  'picked up':          'The delivery partner picked up the order.',
  'on the way':         'Your order is on the way! 🏍️',
  delivered:            'Delivered successfully! Enjoy your meal 🎉',
  rejected:             'The restaurant rejected this order.',
};

const STATUS_COLORS = {
  'order placed':       '#f59e0b',
  'restaurant accepted':'#3b82f6',
  preparing:            '#8b5cf6',
  'agent assigned':     '#06b6d4',
  'picked up':          '#10b981',
  'on the way':         '#22c55e',
  delivered:            '#16a34a',
  rejected:             '#ef4444',
};

const STATUS_EMOJI = {
  'order placed':       '📝',
  'restaurant accepted':'✅',
  preparing:            '👨‍🍳',
  'agent assigned':     '🤝',
  'picked up':          '📦',
  'on the way':         '🏍️',
  delivered:            '🎉',
  rejected:             '❌',
};

function formatTime(ms) {
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: 'short',
  }).format(new Date(ms));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrdersScreen({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setOrders(list);
        // Auto-expand the most recent active order
        const active = list.find(o => o.status !== 'delivered' && o.status !== 'rejected');
        if (active) setExpandedId(id => id || active.id);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Could not load orders.');
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const activeOrder = useMemo(
    () => orders.find(o => o.status !== 'delivered' && o.status !== 'rejected'),
    [orders]
  );
  const pastOrders = useMemo(
    () => orders.filter(o => o.status === 'delivered' || o.status === 'rejected'),
    [orders]
  );

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.zeptoPurple} />
        <Text style={styles.loadingText}>Loading your orders…</Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Tracking paused</Text>
        <Text style={styles.emptySub}>{error}</Text>
      </View>
    );
  }

  // ── Empty ──
  if (!orders.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySub}>
          Browse restaurants and place your first Minnex order!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
        {orders.length > 0 && (
          <View style={styles.orderCountBadge}>
            <Text style={styles.orderCountText}>{orders.length}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Order ── */}
        {activeOrder && (
          <>
            <Text style={styles.sectionLabel}>LIVE ORDER</Text>
            <ActiveOrderCard
              order={activeOrder}
              expanded={expandedId === activeOrder.id}
              onToggle={() =>
                setExpandedId(id => (id === activeOrder.id ? null : activeOrder.id))
              }
            />
          </>
        )}

        {/* ── Past Orders ── */}
        {pastOrders.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PAST ORDERS</Text>
            {pastOrders.map(order => (
              <PastOrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() =>
                  setExpandedId(id => (id === order.id ? null : order.id))
                }
              />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Active Order Card ─────────────────────────────────────────────────────────
function ActiveOrderCard({ order, expanded, onToggle }) {
  const normalizedStatus = order.status || 'order placed';
  const activeStep = Math.max(0, STATUS_STEPS.indexOf(normalizedStatus));
  const statusColor = STATUS_COLORS[normalizedStatus] || COLORS.primary;

  return (
    <TouchableOpacity
      style={[styles.card, styles.activeCard]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      {/* Pulsing live indicator */}
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.liveLabel, { color: statusColor }]}>LIVE</Text>
        <Text style={styles.liveTime}>{formatTime(order.createdAtMs)}</Text>
      </View>

      {/* Shop + price */}
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopName}>{order.shopName}</Text>
          <Text style={styles.statusCopy}>
            {STATUS_EMOJI[normalizedStatus]} {STATUS_COPY[normalizedStatus] || 'Status updates will appear here.'}
          </Text>
          {order.agentName ? (
            <Text style={styles.agentText}>🏍️ Partner: {order.agentName}</Text>
          ) : null}
        </View>
        <View style={[styles.pricePill, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.priceText, { color: statusColor }]}>₹{order.price}</Text>
        </View>
      </View>

      {/* Progress stepper */}
      <View style={styles.stepperRow}>
        {STATUS_STEPS.slice(0, -1).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepSegment,
              i < activeStep && { backgroundColor: statusColor },
              i === activeStep - 1 && { borderRightColor: statusColor },
            ]}
          />
        ))}
      </View>
      <View style={styles.stepDotRow}>
        {STATUS_STEPS.map((step, i) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              i <= activeStep && { backgroundColor: statusColor, borderColor: statusColor },
            ]}
          />
        ))}
      </View>
      <View style={styles.stepLabelRow}>
        <Text style={[styles.stepLabelFirst, { color: COLORS.textMuted }]}>Placed</Text>
        <Text style={[styles.stepLabelLast, { color: COLORS.textMuted }]}>Delivered</Text>
      </View>

      {/* Expand: show full timeline */}
      {expanded && order.timeline?.length > 0 && (
        <View style={styles.timeline}>
          <View style={styles.timelineDivider} />
          {[...order.timeline].reverse().map((event, i) => (
            <View key={i} style={styles.timelineEvent}>
              <View style={styles.timelineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineLabel}>{event.label}</Text>
                <Text style={styles.timelineTime}>{formatTime(event.at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bill summary */}
      {expanded && order.billing && (
        <View style={styles.billSection}>
          <View style={styles.timelineDivider} />
          <Text style={styles.eyebrow}>Bill Breakdown</Text>
          {[
            ['Food', order.billing.subtotal],
            ['Delivery fee', order.billing.deliveryFee],
            ['Platform fee', order.billing.platformFee],
            ['Tip', order.billing.tip],
            ['Total', order.billing.customerTotal || order.price],
          ]
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([label, val]) => (
              <View key={label} style={styles.billRow}>
                <Text style={styles.billLabel}>{label}</Text>
                <Text style={[styles.billValue, label === 'Total' && styles.billTotal]}>
                  ₹{val}
                </Text>
              </View>
            ))}
        </View>
      )}

      <Text style={styles.expandHint}>
        {expanded ? '▲ Collapse' : '▼ View timeline & bill'}
      </Text>
    </TouchableOpacity>
  );
}

// ── Past Order Card ───────────────────────────────────────────────────────────
function PastOrderCard({ order, expanded, onToggle }) {
  const isDelivered = order.status === 'delivered';
  const statusColor = STATUS_COLORS[order.status] || COLORS.textMuted;

  return (
    <TouchableOpacity
      style={[styles.card, styles.pastCard]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pastShopName}>{order.shopName}</Text>
          <Text style={styles.pastTime}>{formatTime(order.createdAtMs)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {STATUS_EMOJI[order.status]} {order.status}
            </Text>
          </View>
          <Text style={styles.pastPrice}>₹{order.price}</Text>
        </View>
      </View>

      {expanded && order.billing && (
        <View style={[styles.billSection, { marginTop: 12 }]}>
          <View style={styles.timelineDivider} />
          {[
            ['Food', order.billing.subtotal],
            ['Delivery fee', order.billing.deliveryFee],
            ['Platform fee', order.billing.platformFee],
            ['Tip', order.billing.tip],
            ['Total paid', order.billing.customerTotal || order.price],
          ]
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([label, val]) => (
              <View key={label} style={styles.billRow}>
                <Text style={styles.billLabel}>{label}</Text>
                <Text style={[styles.billValue, label === 'Total paid' && styles.billTotal]}>
                  ₹{val}
                </Text>
              </View>
            ))}
        </View>
      )}

      {expanded && order.feedback && (
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackText}>
            ⭐ Food {order.feedback.foodRating}/5 · Partner {order.feedback.agentRating}/5
          </Text>
        </View>
      )}

      <Text style={styles.expandHint}>
        {expanded ? '▲ Collapse' : '▼ View details'}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.bg, padding: 32,
  },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  emptySub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  header: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.soft,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary, flex: 1 },
  orderCountBadge: {
    backgroundColor: COLORS.zeptoPurpleLight, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  orderCountText: { fontSize: 13, fontWeight: '800', color: COLORS.zeptoPurple },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 1.5, marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24, padding: 20,
    marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  activeCard: {
    borderWidth: 1.5,
    borderColor: COLORS.zeptoPurple + '30',
  },
  pastCard: { opacity: 0.92 },

  // ── Live / Active ──
  liveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  liveLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  liveTime: { flex: 1, textAlign: 'right', fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18, gap: 12,
  },
  shopName: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 6 },
  statusCopy: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, fontWeight: '500' },
  agentText: { fontSize: 13, color: COLORS.green, marginTop: 6, fontWeight: '700' },
  pricePill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  priceText: { fontWeight: '900', fontSize: 16 },

  // ── Progress stepper ──
  stepperRow: {
    flexDirection: 'row', marginBottom: 4, marginHorizontal: 4,
  },
  stepSegment: {
    flex: 1, height: 3, backgroundColor: COLORS.border,
    marginHorizontal: 1, borderRadius: 2,
  },
  stepDotRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 6, marginHorizontal: 0,
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.border,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  stepLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  stepLabelFirst: { fontSize: 11, fontWeight: '600' },
  stepLabelLast: { fontSize: 11, fontWeight: '600' },

  // ── Timeline ──
  timeline: { marginTop: 4 },
  timelineDivider: {
    height: 1, backgroundColor: COLORS.border,
    marginVertical: 14, marginHorizontal: -4,
  },
  timelineEvent: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, paddingVertical: 6,
  },
  timelineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.zeptoPurple, marginTop: 5, flexShrink: 0,
  },
  timelineLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '600', lineHeight: 20 },
  timelineTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', marginTop: 1 },

  // ── Bill ──
  billSection: {},
  eyebrow: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5,
  },
  billLabel: { fontSize: 14, color: COLORS.textSecondary },
  billValue: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  billTotal: { fontWeight: '900', fontSize: 15 },

  expandHint: {
    textAlign: 'center', color: COLORS.textMuted,
    fontSize: 12, fontWeight: '700', marginTop: 14,
    letterSpacing: 0.5,
  },

  // ── Past order ──
  pastShopName: { fontSize: 17, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  pastTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  pastPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  statusBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  feedbackRow: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  feedbackText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
});
