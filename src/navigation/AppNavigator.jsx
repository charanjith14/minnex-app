import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();

function Icon({ label, focused }) {
  const icons = { 
    Home: '🏠', 
    Categories: '🔳', 
    'Buy Again': '🛍️', 
    Fresh: '🥦', 
    Live: '📺' 
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, color: focused ? COLORS.primary : COLORS.textSecondary }}>
        {icons[label]}
      </Text>
    </View>
  );
}

export default function AppNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <Icon label={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
        headerShown: false, // Use custom headers in screens
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Categories">
        {() => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Categories Screen</Text></View>}
      </Tab.Screen>
      <Tab.Screen name="Buy Again">
        {() => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Buy Again Screen</Text></View>}
      </Tab.Screen>
      <Tab.Screen name="Fresh">
        {() => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Fresh Screen</Text></View>}
      </Tab.Screen>
      <Tab.Screen name="Live">
        {() => <ProfileScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
