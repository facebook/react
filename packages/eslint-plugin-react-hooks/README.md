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
    "react-hooks/no-nested-components": "error",
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

## no-nested-components

Based of [`react/no-unstable-nested-components`](https://github.com/jsx-eslint/eslint-plugin-react/blob/8beb2aae3fbe36dd6f495b72cb20b27c043aff68/docs/rules/no-unstable-nested-components.md) but with a [detection mechanism consistent with Rules of Hooks](https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce).

Creating components inside components (nested components) will cause React to throw away the state of those nested components on each re-render of their parent.

React reconciliation performs element type comparison with [reference equality](https://reactjs.org/docs/reconciliation.html#elements-of-different-types). The reference to the same element changes on each re-render when defining components inside the render block. This leads to complete recreation of the current node and all its children. As a result the virtual DOM has to do extra unnecessary work and [possible bugs are introduced](https://codepen.io/ariperkkio/pen/vYLodLB).

### `no-nested-components` details

The following patterns are considered warnings:

```jsx
function Component() {
  // nested component declaration
  function UnstableNestedComponent() {
    return <div />;
  }

  return (
    <div>
      <UnstableNestedComponent />
    </div>
  );
}
```


```jsx
function useComponent() {
  // Nested component declaration in a hook. See https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce for what's considered a Component and hook.
  return function Component() {
    return <div />
  }
}
```

```jsx
function Component() {
  const config = React.useMemo({
    // Nested component declaration. See https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce for what's considered a component.
    ArrowDown(event) {

    }
  })

  return (
    <div>
      <UnstableNestedComponent />
    </div>
  );
}
```


The following patterns are **not** considered warnings:

```jsx
function OutsideDefinedComponent(props) {
  return <div />;
}

function Component() {
  return (
    <div>
      <OutsideDefinedComponent />
    </div>
  );
}
```

⚠️ WARNING ⚠️:

Creating nested but memoized components should also be avoided since memoization is a performance concern not a semantic guarantee.
If the `useCallback` or `useMemo` hook has no dependency, you can safely move the component definition out of the render function.
If the hook does have dependencies, you should refactor the code so that you're able to move the component definition out of the render function.
If you want React to throw away the state of the nested component, use a [`key`](https://reactjs.org/docs/lists-and-keys.html#keys) instead.

```jsx
function Component() {
  // No ESLint warning but `MemoizedNestedComponent` should be moved outside of `Component`.
  const MemoizedNestedComponent = React.useCallback(() => <div />, []);

  return (
    <div>
      <MemoizedNestedComponent />
    </div>
  );
}
```
