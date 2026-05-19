import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: true,
};

export const triggerHaptic = (type = 'impactLight') => {
  try {
    ReactNativeHapticFeedback.trigger(type, options);
  } catch (error) {
    // Silently fail if haptics aren't available or linked
    console.log('Haptic error:', error);
  }
};
