/**
 * Jest config — pure-helper unit tests only.
 *
 * Intentionally not using jest-expo. We test the data-shaping helpers
 * that have no React Native imports (Brzycki, streak math, date
 * formatting). Component tests with Animated/Reanimated/expo would
 * need the heavy preset; we'll add that when we have a real reason.
 *
 * Files matching `*.test.ts(x)` under src/ and lib/ are picked up.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/?(*.)+(test).+(ts|tsx)", "<rootDir>/lib/**/?(*.)+(test).+(ts|tsx)"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.expo/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Pure helpers don't need transforms beyond ts-jest. If you ever import
  // a file that uses RN/expo, switch this entry to jest-expo.
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-native" } }],
  },
};
