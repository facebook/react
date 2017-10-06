---
id: react-without-jsx
title: React Without JSX
permalink: docs/react-without-jsx.html
---

JSX is not a requirement for using React. React exposes an API for creating elements with functions instead of JSX. This is especially convenient if you want to use React without introducing compilation steps to your build process.

### Using `React.createElement()`

Each JSX element is actually syntactic sugar for calling `React.createElement(component, props, ...children)`. Therefore, creating elements without JSX is possible by using `React.createElement()`.

Consider the code below written with JSX:

```js
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>;
  }
}

ReactDOM.render(
  <Hello toWhat="World" />,
  document.getElementById('root')
);
```

It is then compiled to code that does not use JSX:

```js
class Hello extends React.Component {
  render() {
    return React.createElement('div', null, `Hello ${this.props.toWhat}`);
  }
}

ReactDOM.render(
  React.createElement(Hello, { toWhat: 'World' }, null),
  document.getElementById('root')
);
```

`React.createElement()` takes three arguments arguments: a component, a `props` object, and any number of children as the final arguments.

The component argument can take a number of forms:

1. A string - `React.createElement("div", null, null)`
2. A sub-class of `React.Component` - `React.createElement(Hello, null, null)`
3. A plain stateless-functional componet - `React.createElement(HelloFunctionalComponent, null, null)`

To learn more about the function signature and arguments, you can read [the API documentation.](/docs/react-api.html#createelement)

### Examples 

If you're curious to see more examples of how JSX is converted to JavaScript, you can try out [the online Babel compiler](https://babeljs.io/repl/#?babili=false&evaluate=true&lineWrap=false&presets=es2015%2Creact%2Cstage-0&code=function%20hello()%20%7B%0A%20%20return%20%3Cdiv%3EHello%20world!%3C%2Fdiv%3E%3B%0A%7D).

If you want to use `React.createElement()` API without ES6, follow the [React Without ES6 Guide](/docs/react-without-es6.html) and use `React.createElement()` instead of JSX.

### Eliminating Boilerplate

If writing `React.createElement()` often becomes tiring, a common pattern is to assign the function to a shorter variable and use it as shorthand. Using this shorthand allows for creating elements without JSX to be almost as convenient as creating elements with JSX.

```js
const e = React.createElement;

ReactDOM.render(
  e('div', null, 'Hello World'),
  document.getElementById('root')
);
```

Alternatively, you can refer to community projects such as [`react-hyperscript`](https://github.com/mlmorg/react-hyperscript) and [`hyperscript-helpers`](https://github.com/ohanhi/hyperscript-helpers) which offer a more terse syntax.

