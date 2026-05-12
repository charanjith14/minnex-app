import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/firebase/config";
import Login from "./src/components/Login";
import Main from "./src/components/Main";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1150);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !splashDone) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashLogoWord}>Minnex</Text>
        <Text style={styles.splashTagline}>delivery</Text>
        <ActivityIndicator size="large" color="#ff6b00" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return user ? <Main user={user} /> : <Login />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogoWord: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
  },
  splashTagline: {
    color: "#ff6b00",
    fontSize: 16,
    fontWeight: "800",
  },
});
