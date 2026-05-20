module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|@react-navigation|react-native-.*|@firebase|firebase)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^react-native-haptic-feedback$':
      '<rootDir>/__mocks__/react-native-haptic-feedback.js',
  },
};
