import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'archive', 'node_modules', '**/*.d.ts'] },

  // Base JS + TypeScript rules for everything under src.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React rules only for the UI + app layers.
  {
    files: ['src/{ui,app}/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Architectural boundaries: engine -> ai -> ui -> app (one direction only).
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'engine', pattern: 'src/engine/**' },
        { type: 'ai', pattern: 'src/ai/**' },
        { type: 'ui', pattern: 'src/ui/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'test', pattern: 'src/test/**' },
      ],
    },
    rules: {
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'This import violates the layered architecture (engine → ai → ui → app, one direction only). See CLAUDE.md.',
          policies: [
            { from: [{ element: { type: 'engine' } }], allow: [{ to: { element: { type: ['engine'] } } }] },
            { from: [{ element: { type: 'ai' } }], allow: [{ to: { element: { type: ['ai', 'engine'] } } }] },
            { from: [{ element: { type: 'ui' } }], allow: [{ to: { element: { type: ['ui', 'ai', 'engine'] } } }] },
            {
              from: [{ element: { type: 'app' } }],
              allow: [{ to: { element: { type: ['app', 'ui', 'ai', 'engine'] } } }],
            },
            {
              from: [{ element: { type: 'test' } }],
              allow: [{ to: { element: { type: ['test', 'engine', 'ai', 'ui', 'app'] } } }],
            },
          ],
        },
      ],
    },
  },

  // The engine and ai layers must stay free of DOM/React/browser globals.
  {
    files: ['src/{engine,ai}/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*', 'react-dom/*'], message: 'The engine/ai layers must be pure — no React.' },
          ],
        },
      ],
    },
  },

  // Relax a couple of rules for tests.
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
