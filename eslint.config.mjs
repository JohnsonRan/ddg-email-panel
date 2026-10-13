import next from 'eslint-config-next'

const config = [
  ...next,
  {
    // `eslint-config-next` only registers the TypeScript plugin for TS files,
    // so the overrides have to be scoped to them.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // The API routes intentionally proxy DuckDuckGo's error shape.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'public/sw.js', 'next-env.d.ts'],
  },
]

export default config
