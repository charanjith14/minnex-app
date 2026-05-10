import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();

function Icon({ label, focused }) {
  const icons = { Home: '🍽️', Orders: '📦', Profile: '👤' };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icons[label]}</Text>
    </View>
  );
}

export default function AppNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <Icon label={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        headerStyle: { backgroundColor: COLORS.bg, shadowColor: 'transparent', borderBottomWidth: 0 },
        headerTitleStyle: { color: COLORS.text, fontWeight: '900', fontSize: 20 },
        headerLeft: () => (
          <Text style={{ marginLeft: 16, fontSize: 13, color: COLORS.textSecondary }}>
            📍 Home, Location...
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Orders">
        {() => <OrdersScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
