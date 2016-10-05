---
id: react-without-jsx
title: React Without JSX
permalink: docs/react-without-jsx.html
---

JSX is not a requirement for using React. Using React without JSX is especially convenient when you don't want to set up transpilation in your build environment.

Each JSX element is just syntactic sugar for calling `React.createElement(component, props, children)`. So, anything you can do with JSX can also be done with just plain JavaScript.

For example, this code written with JSX:

```js
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>;
  }
}

ReactDOM.render(<Hello toWhat={'World'} />,
                document.getElementById('root'));
```

can also be written without JSX:

```js
class Hello extends React.Component {
  render() {
    return React.createElement('div', null, `Hello ${this.props.toWhat}`);
  }
}

ReactDOM.render(React.createElement(Hello, {toWhat: 'World'}, null),
                document.getElementById('root'));
```

If you're curious to see more examples of how JSX is converted to JavaScript, you can try out [the online Babel transpiler](http://tinyurl.com/j26hzbz).

The component can either be provided as a string, or as a subclass of `React.Component`, or a plain function for stateless components.

If you get tired of typing `React.createElement` so much, one common pattern is to assign a shorthand:

```js
var e = React.createElement;

ReactDOM.render(e('div', null, 'Hello World'),
                document.getElementById('root'));
```

If you use this shorthand form for `React.createElement`, it can be almost as convenient to use React without JSX.
