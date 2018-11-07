# `eslint-plugin-react-hooks`

This ESLint plugin enforces the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).

It is a part of the [Hooks proposal](https://reactjs.org/docs/hooks-intro.html) for React.

## Experimental Status

This is an experimental release and is intended to be used for testing the Hooks proposal with React 16.7 alpha. The exact heuristics it uses may be adjusted.

The [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) documentation contains a link to the technical RFC. Please leave a comment on the RFC if you have concerns or ideas about how this plugin should work.

## Installation

**Note: If you're using Create React App, please wait for a corresponding experimental release of `react-scripts` that includes this rule instead of adding it directly.**

Assuming you already have ESLint installed, run:

```sh
# npm
npm install eslint-plugin-react-hooks@next --save-dev

# yarn
yarn add eslint-plugin-react-hooks@next --dev
```

Then add it to your ESLint configuration:

```js
{
  "plugins": [
    // ...
    "react-hooks"
  ],
  "rules": {
    // ...
    "react-hooks/rules-of-hooks": "error"
  }
}
```

## Valid and Invalid Examples

Please refer to the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) documentation and the [Hooks FAQ](https://reactjs.org/docs/hooks-faq.html#what-exactly-do-the-lint-rules-enforce) to learn more about this rule.

## License

MIT
