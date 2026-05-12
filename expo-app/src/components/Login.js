import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// import { auth } from "../firebase/config"; 
// Note: Phone auth in React Native Expo requires setup with Firebase native SDKs or specific web reCAPTCHA workarounds.

export default function Login({ mode = "customer" }) {
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSendOtp = () => {
    if (phone.length !== 10) {
      setMessage("Enter a valid 10 digit mobile number.");
      return;
    }
    setLoading(true);
    // Mock OTP sending for now, as real React Native Phone Auth needs APNs/FCM configuration.
    setTimeout(() => {
      setConfirmation(true);
      setMessage("OTP sent. (Mocked for Expo Go)");
      setLoading(false);
    }, 1000);
  };

  const onVerifyOtp = () => {
    if (otp.length < 4) {
      setMessage("Enter the OTP.");
      return;
    }
    setLoading(true);
    // Mock verify
    setTimeout(() => {
      setMessage("Verification successful. (Mocked)");
      setLoading(false);
      // In a real app, this would update the auth state and App.js would render Main.
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <View style={styles.brandStack}>
          <Text style={styles.logoWord}>Minnex</Text>
          <Text style={styles.logoTagline}>delivery</Text>
          <Text style={styles.title}>
            Fresh orders. Live movement. One clean checkout.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneField}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
              editable={!loading && !confirmation}
            />
          </View>

          {confirmation && (
            <>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.inputSingle}
                placeholder="6 digit code"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="number-pad"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
                editable={!loading}
              />
            </>
          )}

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={confirmation ? onVerifyOtp : onSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {confirmation ? "Verify OTP" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>

          {message ? <Text style={styles.notice}>{message}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    backgroundColor: "rgba(10, 15, 30, 0.88)",
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  brandStack: {
    marginBottom: 28,
  },
  logoWord: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
  },
  logoTagline: {
    color: "#ff6b00",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
  },
  form: {
    gap: 12,
  },
  label: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    height: 52,
  },
  countryCode: {
    color: "rgba(255,255,255,0.7)",
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.18)",
  },
  input: {
    flex: 1,
    color: "white",
    paddingHorizontal: 14,
    fontSize: 16,
  },
  inputSingle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    height: 52,
    color: "white",
    paddingHorizontal: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#ff6b00",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  notice: {
    color: "#ff6b00",
    marginTop: 12,
    textAlign: "center",
  }
});
