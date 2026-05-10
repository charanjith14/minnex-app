import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SHOPS, FILTERS } from '../constants';

// ── Cart state (lifted from parent via props in real app, kept inline for brevity)
const INITIAL_CART = {};

export default function HomeScreen({ user }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cart, setCart] = useState(INITIAL_CART); // { shopId: qty }

  const visibleShops = useMemo(() => {
    let list = [...SHOPS];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.cuisine.toLowerCase().includes(q) ||
        s.item.name.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'Rating 4.5+') list = list.filter(s => parseFloat(s.rating) >= 4.5);
    if (activeFilter === 'Under ₹150') list = list.filter(s => s.price < 150);
    if (activeFilter === 'Fast (< 25 min)') list = list.filter(s => parseInt(s.eta) < 25);
    if (activeFilter === 'Pure veg') list = list.filter(s => ['Healthy', 'Kerala'].includes(s.cuisine));

    list.sort((a, b) =>
      (b.isOpen ? 50 : 0) + parseFloat(b.rating) * 10 + b.sponsoredBoost * 5 - b.distanceKm -
      ((a.isOpen ? 50 : 0) + parseFloat(a.rating) * 10 + a.sponsoredBoost * 5 - a.distanceKm)
    );
    return list;
  }, [search, activeFilter]);

  const cartTotal = useMemo(() =>
    Object.entries(cart).reduce((sum, [shopId, qty]) => {
      const shop = SHOPS.find(s => s.id === shopId);
      return sum + (shop ? shop.price * qty : 0);
    }, 0), [cart]);

  const cartCount = useMemo(() =>
    Object.values(cart).reduce((sum, qty) => sum + qty, 0), [cart]);

  const setQty = useCallback((shopId, qty) => {
    setCart(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[shopId];
      else next[shopId] = qty;
      return next;
    });
  }, []);

  const renderShop = ({ item: shop }) => {
    const qty = cart[shop.id] || 0;
    return (
      <View style={[styles.card, !shop.isOpen && styles.cardClosed]}>
        <Image source={{ uri: shop.image }} style={styles.cardImg} />
        {shop.offer ? <View style={styles.offerBadge}><Text style={styles.offerText}>{shop.offer}</Text></View> : null}

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>★ {shop.rating}</Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{shop.cuisine}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{shop.eta}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{shop.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>₹{shop.price}</Text>
          </View>
          <Text style={styles.itemName}>{shop.item.name}</Text>

          <View style={styles.addRow}>
            {qty === 0 ? (
              <TouchableOpacity
                style={[styles.addBtn, !shop.isOpen && styles.addBtnDisabled]}
                onPress={() => shop.isOpen && setQty(shop.id, 1)}
                disabled={!shop.isOpen}
              >
                <Text style={styles.addBtnText}>{shop.isOpen ? 'ADD' : 'CLOSED'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(shop.id, qty - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(shop.id, qty + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search for biryani, burger..."
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f === activeFilter ? 'All' : f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section header */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <Text style={styles.sectionCount}>{visibleShops.length} options</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={visibleShops}
        keyExtractor={item => item.id}
        renderItem={renderShop}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySub}>Try another search or filter.</Text>
          </View>
        }
      />

      {/* Cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => Alert.alert('Cart', `${cartCount} items · ₹${cartTotal}\n\nOrder flow coming soon!`)}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
            <Text style={styles.cartLabel}>View Cart</Text>
          </View>
          <Text style={styles.cartTotal}>₹{cartTotal}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  searchIcon: { marginRight: 10, fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  chips: { maxHeight: 48, marginBottom: 4 },
  chipsContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sectionCount: { fontSize: 13, color: COLORS.textSecondary },
  feed: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  cardClosed: { opacity: 0.55 },
  cardImg: { width: '100%', height: 180 },
  offerBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  offerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  shopName: { fontSize: 17, fontWeight: '800', color: COLORS.text, flex: 1, marginRight: 8 },
  ratingPill: { backgroundColor: '#1a3d2b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingText: { color: COLORS.green, fontSize: 13, fontWeight: '700' },
  cuisine: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  metaDot: { color: COLORS.textSecondary, marginHorizontal: 6 },
  itemName: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginBottom: 12 },
  addRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  addBtn: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.primary,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
  },
  qtyBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  qtyBtnText: { color: COLORS.primary, fontSize: 20, fontWeight: '800' },
  qtyNum: { color: COLORS.primary, fontWeight: '800', fontSize: 16, minWidth: 28, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  cartBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: COLORS.primary, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center' },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 10,
  },
  cartBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cartLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cartTotal: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
