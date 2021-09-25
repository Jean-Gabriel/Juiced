module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx)",
    "**/?(*.)+(test).+(ts|tsx)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  globals: {
    'ts-jest': {
      tsConfig: {
        target: 'ES2019'
      }
    }
  }
};