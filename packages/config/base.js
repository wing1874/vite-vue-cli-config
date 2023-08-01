export const packages = ['vue-eslint-parser', 'eslint-plugin-vue'];

// 重写的 eslint 配置
export const eslintOverrides = [
  {
    files: ['*.js'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['*.vue'],
    parser: 'vue-eslint-parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],
    plugins: ['vue', 'prettier'],
    rules: {
      'no-unused-vars': 'warn',
      'vue/multi-word-component-names': 0,
    },
  },
];
