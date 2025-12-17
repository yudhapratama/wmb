import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '**/assets/**', 
      'dist/**', 
      'node_modules/**', 
      'public/**'
    ]
  },
  {
    // JavaScript and CJS files
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: {
          jsx: true // Allows JSX in regular .js files
        }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'error'
    }
  },
  {
    // Vue files
    files: ['**/*.vue'],
    plugins: {
      vue: pluginVue
    },
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        // THIS IS THE FIX:
        // Tells the Vue parser to allow JSX syntax inside <script>
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-undef': 'error',
      'vue/no-undef-properties': 'error', 
      'no-unused-vars': 'off',
      'vue/no-unused-vars': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-parsing-error': 'off' // Extra safety for JSX in templates
    }
  }
]
