import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vite.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'scope:mobile',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:inventory', 'scope:sales'],
            },
            {
              sourceTag: 'scope:mobile-bff',
              onlyDependOnLibsWithTags: [
                'scope:inventory',
                'scope:sales',
                'scope:core',
              ],
            },
            {
              sourceTag: 'scope:inventory',
              onlyDependOnLibsWithTags: ['scope:inventory', 'scope:core'],
            },
            {
              sourceTag: 'scope:customer',
              onlyDependOnLibsWithTags: ['scope:customer', 'scope:core'],
            },
            {
              sourceTag: 'scope:identity',
              onlyDependOnLibsWithTags: ['scope:identity', 'scope:core'],
            },
            {
              sourceTag: 'scope:sales',
              onlyDependOnLibsWithTags: ['scope:sales', 'scope:inventory', 'scope:core'],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['scope:core'],
            },
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:core'],
            },
          ],
        },
      ],
    },
  },
];
