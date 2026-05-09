import { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/config";
import MinnexLogo from "./MinnexLogo.jsx";

const cleanPhone = (value) => value.replace(/\D/g, "").slice(0, 10);

export default function Login({ mode = "customer" }) {
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isAgent = mode === "agent";
  const isAdmin = mode === "admin";
  const variant = isAdmin ? "admin" : isAgent ? "agent" : "customer";
  const title = isAdmin
    ? "Run orders, kitchen, support, and settlements from one premium desk."
    : isAgent
      ? "Deliver faster with priority pickups, live earnings, and clean handoffs."
      : "Fresh orders. Live movement. One clean checkout.";
  const eyebrow = isAdmin ? "Minnex Biz" : isAgent ? "Minnex Go" : "Minnex";

  const setupRecaptcha = async () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }

    await window.recaptchaVerifier.render();
    return window.recaptchaVerifier;
  };

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const onSendOtp = async () => {
    const digits = cleanPhone(phone);

    if (digits.length !== 10) {
      setMessage("Enter a valid 10 digit mobile number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const verifier = await setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, `+91${digits}`, verifier);
      setConfirmation(result);
      setMessage("OTP sent.");
    } catch (error) {
      resetRecaptcha();
      setMessage(error.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!confirmation || otp.trim().length < 4) {
      setMessage("Enter the OTP sent to your phone.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await confirmation.confirm(otp.trim());
    } catch (error) {
      setMessage(error.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`login-screen login-screen-${variant}`}>
      <section className="login-panel">
        <div className="brand-stack">
          <MinnexLogo variant={variant} className="login-logo" wordmark tagline />
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
        </div>

        <div className="login-form">
          <label htmlFor="phone">Mobile number</label>
          <div className="phone-field">
            <span>+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={phone}
              onChange={(event) => setPhone(cleanPhone(event.target.value))}
              disabled={loading || Boolean(confirmation)}
            />
          </div>

          {confirmation && (
            <>
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                className="text-input"
                type="text"
                inputMode="numeric"
                placeholder="6 digit code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
              />
            </>
          )}

          <button
            className="primary-button"
            onClick={confirmation ? onVerifyOtp : onSendOtp}
            disabled={loading}
            type="button"
          >
            {loading ? "Please wait..." : confirmation ? "Verify OTP" : "Send OTP"}
          </button>

          {message && <p className="notice">{message}</p>}
        </div>
      </section>
      <div id="recaptcha-container" />
    </main>
  );
}
