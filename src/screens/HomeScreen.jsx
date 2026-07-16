import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, Image, RefreshControl,
} from 'react-native';
import { COLORS, SHOPS, FILTERS, SHADOWS } from '../constants';
import Header from '../components/Header';
import { triggerHaptic } from '../utils/haptics';

const INITIAL_CART = {};

export default function HomeScreen({ user, navigation }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cart, setCart] = useState(INITIAL_CART); 
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    triggerHaptic('impactLight');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      triggerHaptic('notificationSuccess');
    }, 1500);
  }, []);

  const clearSearch = () => {
    triggerHaptic('impactLight');
    setSearch('');
  };

  const handleFilterPress = (f) => {
    triggerHaptic('selection');
    setActiveFilter(f === activeFilter ? 'All' : f);
  };

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
    triggerHaptic(qty > (cart[shopId] || 0) ? 'impactLight' : 'impactLight');
    setCart(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[shopId];
      else next[shopId] = qty;
      return next;
    });
  }, [cart]);

  const renderShop = ({ item: shop }) => {
    const qty = cart[shop.id] || 0;
    return (
      <View style={[styles.card, !shop.isOpen && styles.cardClosed]}>
        <View style={styles.imgContainer}>
          <Image source={{ uri: shop.image }} style={styles.cardImg} />
          {shop.offer ? (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{shop.offer}</Text>
            </View>
          ) : null}
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{shop.eta}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{shop.rating}</Text>
            </View>
          </View>
          
          <Text style={styles.cuisine}>{shop.cuisine}</Text>
          
          <View style={styles.divider} />

          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{shop.item.name}</Text>
              <Text style={styles.itemPrice}>₹{shop.price}</Text>
            </View>

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
                    <Text style={styles.qtyBtnIcon}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(shop.id, qty + 1)}>
                    <Text style={styles.qtyBtnIcon}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Header 
        user={user} 
        balance={0} 
        onProfilePress={() => navigation.getParent()?.navigate('Profile')} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder='Search for "Burger" or "Biryani"'
            placeholderTextColor={COLORS.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => handleFilterPress(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={visibleShops}
        keyExtractor={item => item.id}
        renderItem={renderShop}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Curated for you</Text>
            <Text style={styles.sectionCount}>{visibleShops.length} places</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search.</Text>
          </View>
        }
      />

      {cartCount > 0 && (
        <View style={styles.cartContainer}>
          <TouchableOpacity
            style={styles.cartBar}
            onPress={() => {
              triggerHaptic('impactHeavy');
              const cartItems = Object.entries(cart)
                .map(([shopId, qty]) => {
                  const shop = SHOPS.find(s => s.id === shopId);
                  return shop ? { shop, qty } : null;
                })
                .filter(Boolean);
              navigation.navigate('Cart', { cartItems });
            }}
          >
            <View style={styles.cartLeft}>
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
              <View>
                <Text style={styles.cartLabel}>View Cart</Text>
                <Text style={styles.cartSub}>Extra charges may apply</Text>
              </View>
            </View>
            <View style={styles.cartRight}>
              <Text style={styles.cartTotal}>₹{cartTotal}</Text>
              <Text style={styles.cartArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  searchContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.soft,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, 
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 10, fontSize: 18, color: COLORS.textMuted },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '500' },
  clearBtn: { padding: 4, marginLeft: 8 },
  clearBtnText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '900' },
  chips: { maxHeight: 54, marginTop: 20, marginBottom: 8 },
  chipsContent: { paddingHorizontal: 20, gap: 10, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.soft, shadowOpacity: 0.02,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  sectionCount: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
  feed: { paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 28, marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardClosed: { opacity: 0.6 },
  imgContainer: { position: 'relative' },
  cardImg: { width: '100%', height: 190, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  offerBadge: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: COLORS.zeptoPurple, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    ...SHADOWS.soft,
  },
  offerText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  etaBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  etaText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  cardBody: { padding: 18 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shopName: { fontSize: 20, fontWeight: '900', color: COLORS.primary, flex: 1, marginRight: 12, letterSpacing: -0.3 },
  ratingPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greenLight, 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 
  },
  ratingStar: { color: COLORS.green, fontSize: 12 },
  ratingText: { color: COLORS.green, fontSize: 15, fontWeight: '800' },
  cuisine: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1, marginRight: 16 },
  itemName: { fontSize: 16, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
  itemPrice: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  addRow: { minWidth: 90, alignItems: 'flex-end' },
  addBtn: {
    backgroundColor: COLORS.zeptoPurpleLight, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 10,
  },
  addBtnDisabled: { backgroundColor: COLORS.bg },
  addBtnText: { color: COLORS.zeptoPurple, fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.zeptoPurpleLight, borderRadius: 14,
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  qtyBtnIcon: { color: COLORS.zeptoPurple, fontSize: 19, fontWeight: '900' },
  qtyNum: { color: COLORS.zeptoPurple, fontWeight: '900', fontSize: 17, minWidth: 24, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 8 },
  emptySub: { fontSize: 16, color: COLORS.textSecondary },
  cartContainer: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
  },
  cartBar: {
    backgroundColor: COLORS.primary, borderRadius: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    ...SHADOWS.floating, shadowColor: COLORS.primary,
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center' },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cartBadgeText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cartLabel: { color: '#fff', fontWeight: '800', fontSize: 17, marginBottom: 2 },
  cartSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  cartRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartTotal: { color: '#fff', fontWeight: '900', fontSize: 19 },
  cartArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 19, fontWeight: '900' },
});
