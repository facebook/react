# `eslint-plugin-react-hooks`

This ESLint plugin enforces the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).
It is a part of the [Hooks API](https://react.dev/reference/react/hooks) for React.

---

## Installation

> **Note:** If you're using Create React App, you do **not** need to install this plugin separately. Use `react-scripts` >= 3 to get hook linting automatically.

### 1. Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) >= 14 installed.
- Ensure you have [ESLint](https://eslint.org/) >= 7 installed.

### 2. Install with npm or yarn

```sh
# npm
npm install eslint-plugin-react-hooks --save-dev

# yarn
yarn add eslint-plugin-react-hooks --dev
```

#### Common Installation Issues

If you encounter errors during installation, try the following:

- **Clear npm cache:**
  ```sh
  npm cache clean --force
  ```
- **Check permissions:**  
  If you see EACCES or EPERM errors, you may need to fix directory permissions ([see npm docs](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)).
- **Update npm/yarn:**  
  Ensure you are using the latest version of your package manager.
- **Remove lock files and node_modules:**  
  ```sh
  rm -rf node_modules package-lock.json yarn.lock
  npm install  # or yarn install
  ```
- **Missing peer dependencies:**  
  Ensure you have ESLint installed (`npm ls eslint`). If not, run:
  ```sh
  npm install eslint --save-dev
  ```

If you still encounter installation issues, please refer to the [npm troubleshooting guide](https://docs.npmjs.com/common-errors) or open an issue on the [GitHub repo](https://github.com/facebook/react/issues).

---

## Usage

### Flat Config (eslint.config.js|ts)

#### For v6.0.0 and newer

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      'react-hooks': reactHooks,
    },
    extends: ['react-hooks/recommended'],
  },
]);
```

#### For v5.2.0

```js
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      'react-hooks': reactHooks,
    },
    extends: ['react-hooks/recommended-latest'],
  },
]);
```

### Legacy Config (.eslintrc)

#### For >= 5.2.0

```json
{
  "extends": [
    "plugin:react-hooks/recommended-legacy"
  ]
}
```

#### For < 5.2.0

```json
{
  "extends": [
    "plugin:react-hooks/recommended"
  ]
}
```

---

## Custom Configuration

Fine-tune the rules to your needs:

### Flat Config (eslint.config.js|ts)

```js
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  },
];
```

### Legacy Config (.eslintrc)

```json
{
  "plugins": [
    "react-hooks"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## Advanced: Custom Hook Validation

You can configure `exhaustive-deps` to validate dependencies of custom Hooks:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useMyCustomHook|useMyOtherCustomHook)"
    }]
  }
}
```

> **Recommendation:** Use this option sparingly. Most custom Hooks should avoid dependency arguments and instead expose a focused API.

---

## Troubleshooting

- **Plugin not found?**  
  Make sure your config matches your ESLint version and plugin installation.
- **Rules not working?**  
  Double-check your ESLint config path and restart your editor/IDE after changes.
- **Conflicting rules?**  
  Remove duplicate configs and lint only one ESLint config type (flat or legacy).

If you have persistent issues, search the [issue tracker](https://github.com/facebook/react/issues) or open a new issue with your error log and config.

---

## Valid & Invalid Examples

See the official [Rules of Hooks docs](https://react.dev/reference/rules/rules-of-hooks) for usage examples and best practices.

---

## License

MIT
