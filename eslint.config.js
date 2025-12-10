import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Phaser 全局变量
        Phaser: 'readonly',
      }
    },
    rules: {
      // 代码质量
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // 代码风格
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 4],
      'comma-dangle': ['error', 'only-multiline'],

      // 最佳实践
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
    }
  },
  {
    ignores: ['dist/**', 'www/**', 'node_modules/**', 'ios/**', 'android/**']
  }
];
