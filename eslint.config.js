export default [
  {
    files: ['dist/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      eqeqeq: 'error',
    },
  },
]
