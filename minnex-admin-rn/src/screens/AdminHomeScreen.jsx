import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Alert
} from 'react-native';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const COLORS = {
  bg: '#0f0f14',
  surface: '#1a1a24',
  primary: '#8b5cf6', // Purple for Admin
  primaryLight: 'rgba(139, 92, 246, 0.15)',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: 'rgba(255,255,255,0.08)',
  green: '#22c55e',
  red: '#ef4444'
};

const STATUS_OPTIONS = [
  "all", "order placed", "preparing", "agent assigned", "picked up", "on the way", "delivered", "rejected"
];

export default function AdminHomeScreen({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsub = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setOrders(liveOrders);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const active = orders.filter(o => !['delivered', 'rejected'].includes(o.status)).length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.paid ? Number(o.price || 0) : 0), 0);
    return { active, total: orders.length, revenue: totalRevenue };
  }, [orders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        adminUpdatedAt: Date.now(),
        timeline: arrayUnion({
          key: `admin_${newStatus.replace(/\s/g, '_')}`,
          label: `Admin moved order to ${newStatus}`,
          at: Date.now(),
          by: 'admin'
        })
      });
      Alert.alert("Success", `Order moved to ${newStatus}`);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const renderOrder = ({ item: order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.shopName}>{order.shopName}</Text>
          <Text style={styles.orderId}>ID: {order.id.slice(0, 8)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: order.paid ? COLORS.green : COLORS.red }]}>
          <Text style={styles.statusText}>{order.paid ? 'PAID' : 'UNPAID'}</Text>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <Text style={styles.metaText}>₹{order.price} • {order.status}</Text>
      </View>

      <View style={styles.actions}>
        {order.status === 'order placed' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(order.id, 'preparing')}>
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
        )}
        {order.status !== 'delivered' && order.status !== 'rejected' && (
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.red }]} onPress={() => updateStatus(order.id, 'rejected')}>
            <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{stats.active}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>₹{stats.revenue}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_OPTIONS.map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center'
  },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  statValue: { color: COLORS.primary, fontSize: 18, fontWeight: '800', marginTop: 4 },
  filterContainer: { height: 50, marginBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: COLORS.primary },
  list: { padding: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  shopName: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  orderId: { color: COLORS.textSecondary, fontSize: 12 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  orderMeta: { marginBottom: 16 },
  metaText: { color: COLORS.textSecondary, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary
  },
  actionBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 }
});
