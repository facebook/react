# `eslint-plugin-react-hooks`

This ESLint plugin enforces the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).

It is a part of the [Hooks API](https://reactjs.org/docs/hooks-intro.html) for React.

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
### additionalHooks
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

### ignoreThisDependency
You may find `exhaustive-deps` requires entire `props` if you use something like `props.doSomething()` in hooks.
This is intended behavior because `props` is referred as `this` by `doSomething`.
You can resolve it by destructuring as `exhaustive-deps` suggests.

However, in some cases, you may want to avoid destructuring because of your coding style or conflict with `no-shadow`.
In the case, `ignoreThisDependency` may help.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "ignoreThisDependency": "props"
    }]
  }
}
```

Valid options are `never` (default behavior), `props`, `always`.

## Valid and Invalid Examples

Please refer to the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) documentation and the [Hooks FAQ](https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce) to learn more about this rule.

## License

MIT
