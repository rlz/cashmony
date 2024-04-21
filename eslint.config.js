import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tsEslint from 'typescript-eslint'

export default [
    {
        files: [
            'src/**/*.ts?(x)',
            'utils/**/*.ts?(x)',
            '*.js'
        ],
        languageOptions: {
            parser,
            parserOptions: { project: './tsconfig.json' }
        }
    },
    ...tsEslint.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: false,
        jsx: true,
        commaDangle: 'never'
    }),
    {
        rules: {
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/jsx-curly-brace-presence': ['error', 'always'],
            // '@stylistic/jsx-wrap-multilines': 'off',
            // '@stylistic/jsx-closing-tag-location': 'off',
            '@stylistic/max-statements-per-line': ['error', { max: 2 }]
            // '@stylistic/jsx-closing-bracket-location': 'off'
            // '@stylistic/jsx-indent': 'off'
        }
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSort
        },
        rules: {
            'simple-import-sort/imports': 'error'
        }
    },
    {
        rules: {
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ]
        }
    }
]
