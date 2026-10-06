// ESLint runs ONLY the eslint-plugin-react-hooks rules (Rules of Hooks,
// exhaustive-deps and the React Compiler rules) over the registry, via
// `pnpm lint:react`. Biome stays the main linter/formatter.
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  {
    files: ['packages/ui/registry/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    ...reactHooks.configs.flat['recommended-latest'],
  },
]
