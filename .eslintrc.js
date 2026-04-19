/**
 * ESLint config for the DeepKeep n8n community node.
 *
 * Uses the `eslint-plugin-n8n-nodes-base` preset — the same rules
 * n8n's verification team runs against submissions. Three overrides:
 *   - package.json       → community preset (naming, metadata)
 *   - credentials/*.ts   → credential-specific rules
 *   - nodes/*.ts         → node-specific rules (display names, descriptions, icons, etc.)
 */
module.exports = {
  root: true,
  ignorePatterns: [
    '.eslintrc.js',
    '**/*.js',
    '**/node_modules/**',
    '**/dist/**',
  ],
  overrides: [
    {
      files: ['package.json'],
      parser: 'jsonc-eslint-parser',
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/community'],
      rules: {
        'n8n-nodes-base/community-package-json-name-still-default': 'off',
      },
    },
    {
      files: ['./credentials/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/credentials'],
      rules: {
        // This rule mis-interprets the URL value as an identifier and
        // auto-fixes e.g. "https://deepkeep.ai/docs/api" → "httpsDeepkeepAiDocsApi",
        // which then fails the sibling `-not-http-url` rule. Disable.
        'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
      },
    },
    {
      files: ['./nodes/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/nodes'],
    },
  ],
};
