import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
// import Home from "../Home"; // To be implemented
// import Track from "./Track"; // To be implemented
import { auth } from "../firebase/config"; 

// Placeholder Home Component
const HomePlaceholder = ({ globalSearchTerm }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Home Component Migration In Progress</Text>
    <Text style={{ color: "gray", marginTop: 8 }}>Search: {globalSearchTerm || "None"}</Text>
    <Text style={{ color: "gray", marginTop: 8, textAlign: "center", paddingHorizontal: 20 }}>
      You will need to manually port the 1600 lines of Home.jsx into React Native components.
    </Text>
  </View>
);

export default function Main({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      {activeTab !== "profile" && (
        <View style={styles.topBar}>
          <View style={styles.topBarLocation}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <Text style={styles.locationText}>Home, Location...</Text>
          </View>
          {(activeTab === "home" || activeTab === "search") && (
            <View style={styles.searchBar}>
              <Text>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for food, restaurants..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={globalSearch}
                onChangeText={setGlobalSearch}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        {activeTab === "home" || activeTab === "search" ? (
          <HomePlaceholder globalSearchTerm={globalSearch} />
        ) : activeTab === "orders" ? (
          <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Orders Component</Text></View>
        ) : (
          <View style={styles.profileContainer}>
            <Text style={styles.profileHeader}>Profile</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Logged in as</Text>
              <Text style={styles.profileValue}>{user?.phoneNumber || user?.email || "User"}</Text>
            </View>

            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={() => auth.signOut()}
            >
              <Text style={styles.signOutText}>🚪 Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.navIcon, activeTab === 'home' && styles.navActive]}>🍽️</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navActiveText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('search')}>
          <Text style={[styles.navIcon, activeTab === 'search' && styles.navActive]}>🔍</Text>
          <Text style={[styles.navText, activeTab === 'search' && styles.navActiveText]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.navIcon, activeTab === 'orders' && styles.navActive]}>📦</Text>
          <Text style={[styles.navText, activeTab === 'orders' && styles.navActiveText]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.navIcon, activeTab === 'profile' && styles.navActive]}>👤</Text>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navActiveText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  topBar: {
    padding: 16,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  topBarLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "white",
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#020617",
    paddingBottom: 20, // safe area equivalent
    paddingTop: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  navText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  navActive: {
    opacity: 1,
  },
  navActiveText: {
    color: "#ff6b00",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileContainer: {
    padding: 24,
  },
  profileHeader: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileLabel: {
    color: "#cbd5e1",
    marginBottom: 8,
  },
  profileValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: {
    color: "#f87171",
    fontWeight: "bold",
    fontSize: 16,
  }
});
