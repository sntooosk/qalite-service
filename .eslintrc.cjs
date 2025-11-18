module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['dist/**/*.js'],
      env: { node: true },
    },
  ],
}
