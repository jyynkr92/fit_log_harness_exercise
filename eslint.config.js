// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'lib/database.types.ts', 'supabase/*', 'scripts/*', 'ios/*', 'android/*'],
  },
]);
