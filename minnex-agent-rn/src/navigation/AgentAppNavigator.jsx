import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AgentHomeScreen from '../screens/AgentHomeScreen';

const Tab = createBottomTabNavigator();

export default function AgentAppNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarLabelStyle: { fontWeight: '700' },
        headerStyle: { backgroundColor: '#0f0f14' },
        headerTitleStyle: { color: '#f8fafc', fontWeight: '800' }
      }}
    >
      <Tab.Screen name="Shift" options={{ tabBarIcon: () => <Text>🏍️</Text> }}>
        {() => <AgentHomeScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
