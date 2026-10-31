import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
        files: ['src/**/*.{js,jsx,ts,tsx}', 'createElement.js', 'render.js', 'index.js'],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: { templates: { rules: { 'jsx-references': jsxReferences } } },
        rules: { 'templates/jsx-references': 'error' },
    },
]
