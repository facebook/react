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

Then extend the recommended eslint config:

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

`exhaustive-deps` can be configured to validate dependencies of custom Hooks with the `additionalHooks`, `stableKnownHooks` option.
These options accept a regex to match the names of custom Hooks.

The hook regex in `additionalHook` refers the hooks that have a dependency.

The regex in `stableKnownHooks` refers to hooks whose return value is stable enough that they don't need to be included in the dependencies of other hooks.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useMyCustomHook|useMyOtherCustomHook)"
      "stableKnownHooks": "(useMyStableHook|useMyOtherStableHook)"
    }]
  }
}
```

We suggest to use this option **very sparingly, if at all**. Generally saying, we recommend most custom Hooks to not use the dependencies argument, and instead provide a higher-level API that is more focused around a specific use case.

## Valid and Invalid Examples

Please refer to the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) documentation to learn more about this rule.

## License

MIT
