---
id: react-without-jsx
title: React Without JSX
permalink: docs/react-without-jsx.html
---

JSX is not a requirement for using React. It's basically just syntactic sugar for calling `React.createElement(component, props, children)`. So, anything you can do with JSX can also be done with just plain JavaScript.

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
```
