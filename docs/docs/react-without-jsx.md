---
id: react-without-jsx
title: React Without JSX
permalink: docs/react-without-jsx.html
---

JSX is not a requirement for using React. Each JSX element is just syntactic sugar for calling `React.createElement(component, props, children)`. So, anything you can do with JSX can also be done with just plain JavaScript.

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

The component can either be provided as a string, or as a subclass of `React.Component`, or a plain function for stateless components.

If you get tired of typing `React.createElement` so much, one common pattern is to assign a shorthand:

```js
var e = React.createElement;

ReactDOM.render(e('div', null, 'Hello World'),
                document.getElementById('root'));
```

But in general it's nicer to use JSX, so that the mapping between React elements and DOM elements is straightforward.
