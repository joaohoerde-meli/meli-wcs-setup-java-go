import { defineConfig } from 'eslint/config';
import baseTsConfig from '@meli-lint/eslint-config-base-ts/flat';
import nordicConfig from '@meli-lint/eslint-config-nordic/flat';

export default defineConfig([
  {
    name: 'Base TypeScript Config',
    extends: [baseTsConfig],
  },
  {
    name: 'Nordic Config',
    extends: [nordicConfig],
  },
]);
