import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, Alert, Switch
} from 'react-native';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const COLORS = {
  bg: '#0f0f14',
  surface: '#1a1a24',
  primary: '#22c55e', // Green for Agent
  primaryLight: 'rgba(34, 197, 94, 0.15)',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: 'rgba(255,255,255,0.08)',
  amber: '#f59e0b'
};

const STATUS_FLOW = ["picked up", "on the way", "delivered"];

export default function AgentHomeScreen({ user }) {
  const [orders, setOrders] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoLocation, setAutoLocation] = useState(false);

  const agentId = user.uid;

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, "agents", agentId), (snapshot) => {
      setAgentProfile(snapshot.exists() ? snapshot.data() : null);
    });

    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snapshot) => {
      const liveOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(liveOrders);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubOrders();
    };
  }, [agentId]);

  const pendingPickups = useMemo(() => 
    orders.filter(o => o.status === 'preparing' && !o.agentId && o.paid),
    [orders]
  );

  const myActiveOrder = useMemo(() => 
    orders.find(o => o.agentId === agentId && !['delivered', 'rejected'].includes(o.status)),
    [orders, agentId]
  );

  const acceptOrder = async (order) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", order.id);
        const snap = await transaction.get(orderRef);
        if (snap.data().agentId) throw new Error("Already accepted");

        transaction.update(orderRef, {
          status: 'agent assigned',
          agentId,
          agentName: agentProfile?.agentName || "Minnex Partner",
          assignedAt: Date.now(),
          timeline: arrayUnion({
            key: 'agent_assigned',
            label: 'Partner accepted the pickup',
            at: Date.now(),
            by: agentProfile?.agentName || "Agent"
          })
        });
      });
      Alert.alert("Success", "Pickup accepted!");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        timeline: arrayUnion({
          key: `agent_${newStatus.replace(/\s/g, '_')}`,
          label: `Partner marked ${newStatus}`,
          at: Date.now(),
          by: agentProfile?.agentName || "Agent"
        })
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const renderPickup = ({ item: order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shopName}>{order.shopName}</Text>
        <Text style={styles.price}>₹{order.price}</Text>
      </View>
      <Text style={styles.cuisine}>{order.cuisine || "Food delivery"}</Text>
      <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptOrder(order)}>
        <Text style={styles.acceptBtnText}>Accept Pickup</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <View style={styles.root}>
      {myActiveOrder ? (
        <View style={styles.activeSection}>
          <Text style={styles.eyebrow}>Active Delivery</Text>
          <View style={styles.activeCard}>
            <Text style={styles.activeShop}>{myActiveOrder.shopName}</Text>
            <Text style={styles.activeStatus}>{myActiveOrder.status}</Text>
            
            <View style={styles.statusButtons}>
              {STATUS_FLOW.map(s => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.statusBtn, myActiveOrder.status === s && styles.statusBtnActive]}
                  onPress={() => updateStatus(myActiveOrder.id, s)}
                  disabled={myActiveOrder.status === s}
                >
                  <Text style={[styles.statusBtnText, myActiveOrder.status === s && styles.statusBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Auto location sharing</Text>
            <Switch value={autoLocation} onValueChange={setAutoLocation} thumbColor={COLORS.primary} />
          </View>
        </View>
      ) : (
        <View style={styles.queueSection}>
          <Text style={styles.sectionTitle}>Pickup Queue ({pendingPickups.length})</Text>
          <FlatList
            data={pendingPickups}
            keyExtractor={item => item.id}
            renderItem={renderPickup}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Waiting for new orders...</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { color: COLORS.primary, fontSize: 12, fontWeight: '700', padding: 16, textTransform: 'uppercase' },
  activeSection: { padding: 16 },
  activeCard: {
    backgroundColor: COLORS.surface, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: COLORS.border
  },
  activeShop: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  activeStatus: { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' },
  statusButtons: { flexDirection: 'row', gap: 8, marginTop: 24 },
  statusBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border
  },
  statusBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  statusBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  statusBtnTextActive: { color: COLORS.primary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingHorizontal: 4 },
  toggleLabel: { color: COLORS.textSecondary, fontSize: 14 },
  queueSection: { flex: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', padding: 16 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  shopName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  price: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  cuisine: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 },
  acceptBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center'
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 }
});
