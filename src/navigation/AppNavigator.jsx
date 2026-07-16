import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Orders: '📦',
  Profile: '👤',
};

function HomeTabStack({ user }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain">
        {props => <HomeScreen {...props} user={user} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="Cart"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      >
        {props => <CartScreen {...props} user={user} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

export default function AppNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 21,
                color: focused ? COLORS.zeptoPurple : COLORS.textMuted,
              }}
            >
              {TAB_ICONS[route.name]}
            </Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 68,
        },
        tabBarActiveTintColor: COLORS.zeptoPurple,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeTabStack user={user} />}
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
