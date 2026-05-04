const env = import.meta.env;

export const appEnv = {
  firebaseApiKey: env.REACT_APP_FIREBASE_API_KEY,
  firebaseAuthDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: env.REACT_APP_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: env.REACT_APP_FIREBASE_APP_ID,
  googleMapsApiKey: env.REACT_APP_GOOGLE_MAPS_API_KEY,
  razorpayKeyId: env.REACT_APP_RAZORPAY_KEY_ID
};
