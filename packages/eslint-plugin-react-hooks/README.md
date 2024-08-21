# `eslint-plugin-react-hooks`

This ESLint plugin enforces the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

It is a part of the [Hooks API](https://react.dev/reference/react/hooks) for React.

## Installation

**Note: If you're using Create React App, please use `react-scripts` >= 3 instead of adding it directly.**

Assuming you already have ESLint installed, run:

```sh
# npm
npm install eslint-plugin-react-hooks --save-dev

# yarn
yarn add eslint-plugin-react-hooks --dev
```

### Legacy Config (.eslintrc)

If you are still using ESLint below 9.0.0, please continue to use `recommended-legacy`. To avoid breaking changes, we still support `recommended` as well, but note that this will be changed to alias the flat recommended config in v6.

```js
{
  "extends": [
    // ...
    "plugin:react-hooks/recommended-legacy"
  ]
}
```

### Flat Config (eslint.config.js)

For [ESLint 9.0.0 and above](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/) users, add the `recommended-latest` config.

```js
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // ...
  reactHooks.configs['recommended-latest'],
];
```

### Custom Configuration

If you want more fine-grained configuration, you can instead add a snippet like this to your ESLint configuration file:

#### Legacy Config (.eslintrc)

```js
{
  "plugins": [
    // ...
    "react-hooks"
  ],
  "rules": {
    // ...
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Flat Config (eslint.config.js)

```js
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    // ...
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  },
];
```

## Advanced Configuration

`exhaustive-deps` can be configured to validate dependencies of custom Hooks with the `additionalHooks` option.
This option accepts a regex to match the names of custom Hooks that have dependencies.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useMyCustomHook|useMyOtherCustomHook)"
    }]
  }
}
```

We suggest to use this option **very sparingly, if at all**. Generally saying, we recommend most custom Hooks to not use the dependencies argument, and instead provide a higher-level API that is more focused around a specific use case.

## Valid and Invalid Examples

Please refer to the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) documentation to learn more about this rule.

## License

MIT
