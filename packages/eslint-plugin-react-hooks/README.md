# `eslint-plugin-react-hooks`

This ESLint plugin enforces the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).

It is a part of the [Hooks API](https://reactjs.org/docs/hooks-intro.html) for React.

## Legacy and new config system

From [`v8.21.0`](https://github.com/eslint/eslint/releases/tag/v8.21.0), eslint announced a new config system.
In the new system, `.eslintrc*` is no longer used. `eslint.config.js` would be the default config file name.
In eslint `v8`, the legacy system (`.eslintrc*`) would still be supported, while in eslint `v9`, only the new system would be supported.

And from [`v8.23.0`](https://github.com/eslint/eslint/releases/tag/v8.23.0), eslint CLI starts to look up `eslint.config.js`.
**So, if your eslint is `>=8.23.0`, you're 100% ready to use the new config system.**

You might want to check out the official blog posts,

- <https://eslint.org/blog/2022/08/new-config-system-part-1/>
- <https://eslint.org/blog/2022/08/new-config-system-part-2/>
- <https://eslint.org/blog/2022/08/new-config-system-part-3/>

and the [official docs](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new).

The usage of `eslint-plugin-react-hooks` slightly different between the legacy and the new system.

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

## Shareable config (legacy: `.eslintrc*`)

```js
{
  "extends": [
    // ...
    "plugin:react-hooks/recommended"
  ]
}
```

## Shareable config (new: `eslint.config.js`)

In the new config system, `plugin:` protocol(e.g. `plugin:react/recommended`) is no longer valid.
As eslint does not automatically import the preset config (shareable config), you explicitly do it by yourself.

**Note**: The new plugin object does not have `configs` property as well.

```js
import reactHooks from 'eslint-plugin-react-hooks/recommended' // <== trailing '/recommended'

export default [
  // --- snip ---
  reactHooks, // This is not a plugin object, but a shareable config object
  // --- snip ---
]
```

You can of course add/override some properties.

**Note**: The shareable config does not preconfigure some common fields like `files` and `languageOptions.globals`.
You may want to configure some of them by yourself.

```js
import reactHooks from 'eslint-plugin-react-hooks/recommended'
import globals from 'globals'

export default [
  // --- snip ---
  {
    ...reactHooks,
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // and so on
      },
    },
  },
  // --- snip ---
]
```

## Custom Configuration (legacy: `.eslintrc*`)

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

## Custom Configuration (new: `eslint.config.js`)

If you want more fine-grained configuration, you can use plugin directly.

If your `eslint.config.js` is ESM, you can import and use the plugin like this.

```js
import reactHooks from 'eslint-plugin-react-hook'
import globals from 'globals'

export default [
  // --- snip ---
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      // ...
      'react-hooks': reactHooks, // This is not a shareable config object, but a plugin object
    },
    rules: {
      // ...
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
     },
    // ...
  },
  // --- snip ---
]
```

If your `eslint.config.js` is CJS, you can `require()` different entrypoint like this.

```js
const reactHooks = require('eslint-plugin-react-hooks/new') // <== trailing '/new'

module.exports = [
  // --- snip ---
  {
    // ... others are omitted for brevity
    plugins: {
      'react-hooks': reactHooks,
    },
  },
  // --- snip ---
]
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

Please refer to the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) documentation and the [Hooks FAQ](https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce) to learn more about this rule.

## License

MIT
