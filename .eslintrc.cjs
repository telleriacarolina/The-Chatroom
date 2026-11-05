module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/coverage/**',
    '**/*.min.js',
  ],
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['packages/web/**/*.{js,jsx,ts,tsx}'],
      extends: ['next/core-web-vitals'],
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-unused-vars': 'warn',
      },
    },
  ],
};
