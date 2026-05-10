import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AdminHomeScreen from '../screens/AdminHomeScreen';

const Tab = createBottomTabNavigator();

export default function AdminAppNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#8b5cf6',
        tabBarLabelStyle: { fontWeight: '700' },
        headerStyle: { backgroundColor: '#0f0f14' },
        headerTitleStyle: { color: '#f8fafc', fontWeight: '800' }
      }}
    >
      <Tab.Screen name="Orders" options={{ tabBarIcon: () => <Text>📋</Text> }}>
        {() => <AdminHomeScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
