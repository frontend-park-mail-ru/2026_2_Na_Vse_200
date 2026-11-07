import js from '@eslint/js'
import globals from 'globals'
import ts from 'typescript-eslint'

// JSX неявно использует createElement и компоненты.
// Помечаем их как используемые, чтобы no-unused-vars не ругался.
const jsxReferences = {
    meta: { schema: [] },
    create(context) {
        const sourceCode = context.sourceCode
        return {
            JSXOpeningElement(node) {
                sourceCode.markVariableAsUsed('createElement', node)
                let name = node.name
                while (name.type === 'JSXMemberExpression') name = name.object
                if (
                    name.type === 'JSXIdentifier' &&
                    (node.name.type === 'JSXMemberExpression' || /^[A-Z]/.test(name.name))
                ) {
                    sourceCode.markVariableAsUsed(name.name, node)
                }
            },
        }
    },
}

export default [
    { ignores: ['dist/**', 'packages/*/dist/**', '**/node_modules/**'] },
    js.configs.recommended,
    ...ts.configs.recommended.map(config => ({ ...config, files: ['**/*.{ts,tsx}'] })),
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
    },
    {
        files: ['src/**/*.{js,jsx,ts,tsx}', 'packages/*/src/**/*.ts'],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['scripts/**/*.{js,ts}', '*.config.{js,ts}'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: { templates: { rules: { 'jsx-references': jsxReferences } } },
        rules: { 'templates/jsx-references': 'error' },
    },
]
