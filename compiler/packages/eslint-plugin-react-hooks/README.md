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

### Flat Config (eslint.config.js|ts)

#### 5.2.0

For users of 5.2.0 (the first version with flat config support), add the `recommended-latest` config.

```js
import * as reactHooks from 'eslint-plugin-react-hooks';

export default [
  // ...
  reactHooks.configs['recommended-latest'],
];
```

### Legacy Config (.eslintrc)

#### >= 5.2.0

If you are still using ESLint below 9.0.0, you can use `recommended-legacy` for accessing a legacy version of the recommended config.

```js
{
  "extends": [
    // ...
    "plugin:react-hooks/recommended-legacy"
  ]
}
```

#### < 5.2.0

If you're using a version earlier than 5.2.0, the legacy config was simply `recommended`.

```js
{
  "extends": [
    // ...
    "plugin:react-hooks/recommended"
  ]
}
```

### Custom Configuration

If you want more fine-grained configuration, you can instead add a snippet like this to your ESLint configuration file:

#### Flat Config (eslint.config.js|ts)

```js
import * as reactHooks from 'eslint-plugin-react-hooks';

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

## Advanced Configuration

`exhaustive-deps` can be configured to validate dependencies of custom Hooks with the `additionalHooks` option.
This option accepts a regex to match the names of custom Hooks that have dependencies.

```js
{
  rules: {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      additionalHooks: "(useMyCustomHook|useMyOtherCustomHook)"
    }]
  }
}
```

We suggest to use this option **very sparingly, if at all**. Generally saying, we recommend most custom Hooks to not use the dependencies argument, and instead provide a higher-level API that is more focused around a specific use case.

## Valid and Invalid Examples

Please refer to the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) documentation to learn more about this rule.

## License

MIT
