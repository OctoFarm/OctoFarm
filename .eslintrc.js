module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["eslint:recommended", 'plugin:prettier/recommended'],
  plugins: ["prettier"],
  parser: "@babel/eslint-parser",
  overrides: [],
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 'latest',
  },
  rules: {
    "prettier/prettier": 'error',
    'max-len': [
      'error',
      {
        code: 300,
        ignoreComments: true,
        ignoreUrls: true,
        singleQuote: false,
      },
    ],
    'global-require': 'off',
    quotes: ['error', 'double'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};
