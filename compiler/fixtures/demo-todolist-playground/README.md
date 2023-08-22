# React Forget Demo - Todo List Playground

This is a playground that compare different version of Todolist implementation.

## Get Started

This is a Create-React-App project.

## Structure

- `forget` - a CLI driver to call the compiler from `../`

- `index.js` - the entry point of demo

- `source` - source dir
  - `*.js` - unmemoized code
  - `*.memo.js` - manually memoized code, will be ignored by `forget`
  - `*.half.memo.js` - partially memoized code, will also be ignored by `forget`

- `forget` - output dir

### Compile

```
# npm
npm run forget

# yarn
yarn forget
```
