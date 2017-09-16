---
id: static-type-checking
title: Static Type Checking
permalink: docs/static-type-checking.html
---

When your project codebase growths and became more complicated you can decide that you need more flexibly approach for typechecking than used in PropTypes, or, if you didn't use PropTypes, to add typechecking from scratch with tools throws errors within JavaScript precompilation for more effectively development process.

### Why to use these libraries instead of PropTypes?

Although PropTypes can be useful for typechecking of the props being passed to a component, Flow and Typescript can provide additional tools like interfaces, fixed-length typed arrays, typed objects and primitive variables, annotations, etc. With these advantages taken from typed compiling languages like C and Java this libraries can be more powerful for developing complicated applications.

## Flow

When Typescript is above the standarts of ESMAScript, Flow allows you to use typing within code comments using usual JavaScript:

```js
// @flow

/*::
type MyTypes = {
  foo: string
};
*/

function bar(value /*: MyTypes */) /*: string */ {
  return value.foo.length;
}

bar({ foo: 'Hello, world!' });
```

>**Note:**
>
>Although you can use Flow as in example above, you still be able to use Flow without comment-based syntax.

For try Flow use this [playground](https://flow.org/try/).

### With Babel

To add Flow in your project, you can install `babel-preset-flow` (you should have [babel](http://babeljs.io/docs/setup/) installed):

```bash
yarn add --dev babel-preset-flow
# or
npm install --save-dev babel-preset-flow
```

Then add flow into your Babel config:

```
{
  "presets": ["flow"]
}
```

### With built-in boilerplates

You can use Flow out of the box with [create-react-app](https://flow.org/en/docs/tools/create-react-app/).

## Typescript

Some Typescript features:

- [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- Mapped Types

For fast dive into Typescript, go [here](https://www.typescriptlang.org/play/).

If you want to use Typescript in your React project, you can try [typescript-react-starter](https://github.com/Microsoft/TypeScript-React-Starter#typescript-react-starter).

## Do not complicate things

If you want more flexible typechecking for your project, you can use libraries like Flow or Typescript. But if you don't planned to build complex large application, for example if you want to build simple website or application on React, perhaps you should just use PropTypes package instead. Сome up to choice of development tools carefully.
