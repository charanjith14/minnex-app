import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase/config';
import AdminAppNavigator from './src/navigation/AdminAppNavigator';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={{flex:1, justifyContent:'center', backgroundColor:'#0f0f14'}}><ActivityIndicator color="#8b5cf6"/></View>;

  return (
    <NavigationContainer>
      {user ? <AdminAppNavigator user={user} /> : <View style={{flex:1, backgroundColor:'#0f0f14'}}/>}
    </NavigationContainer>
  );
}
