import type { Rule } from 'eslint'
type JSXName =
    | { type: 'JSXMemberExpression'; object: JSXName }
    | { type: 'JSXIdentifier'; name: string }
    | { type: 'JSXNamespacedName' }
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// JSX неявно использует createElement и компоненты.
// Помечаем их как используемые, чтобы no-unused-vars не ругался.
const jsxReferences: Rule.RuleModule = {
    meta: { schema: [] },
    create(context) {
        const sourceCode = context.sourceCode
        return {
            JSXOpeningElement(node: Rule.Node & { name: JSXName }) {
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
    { ignores: ['dist/**', 'node_modules/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
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
        files: ['src/**/*.{js,jsx,ts,tsx}', 'myReact/**/*.ts'],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['tests/**/*.{js,ts}', 'scripts/**/*.ts', '*.config.ts'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: { templates: { rules: { 'jsx-references': jsxReferences } } },
        rules: { 'templates/jsx-references': 'error' },
    },
]
