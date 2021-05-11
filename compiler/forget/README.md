# React Forget

React Forget is an experimental Babel plugin to automatically memoize React Hooks and Components.

## Development

```sh
# tsc --watch
$ yarn dev

# in another terminal window
$ yarn test --watch
```

## Notes

An overview of the implementation can be found in the [Architecture Overview](./ARCHITECTURE.md).

This transform

- needs [plugin-syntax-jsx](https://babeljs.io/docs/en/babel-plugin-syntax-jsx) as a dependency to inherit the syntax from.
- should be run before [plugin-transform-react-jsx](https://github.com/babel/babel/tree/main/packages/babel-plugin-transform-react-jsx)
- assume the enforcement of [rules of hooks](https://reactjs.org/docs/hooks-rules.html), i.e.
  - only call hooks from React functions
  - only call hooks at the top level
  - <https://www.npmjs.com/package/eslint-plugin-react-hooks>

Scaffolding

- <https://github.com/facebook/flow/tree/master/packages/babel-plugin-transform-flow-enums>
- <https://github.com/babel/babel/blob/main/packages/babel-plugin-transform-react-jsx/src/create-plugin.ts>

Reference

- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
