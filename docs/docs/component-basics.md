---
id: docs-component-basics
title: Component Basics
description: What are components?
layout: docs
next: component-data.html
prev: syntax.html
---

_Components_ are the basic units of composition in React. Components encapsulate
the logic necessary to take input parameters and render markup. Components can
be rendered into an existing DOM element on the page by using
`React.renderComponent`:

```javascript
// Replaces everything in `document.body` with <div>Hello, world!</div>;
React.renderComponent(<div>Hello, world!</div>, document.body);
```

Keep in mind that `<div>` is **not** a DOM element! Keep reading...

## Types of Components

There are two types of components:

 - **Composite Components**
 - **DOM Components**

### Composite Components <small>such as `TodoApp` and `Typeahead`.</small>

The majority of your React code will be implementing composite components.

Composite components are higher-level components with custom rendering logic
that may compose other composite components or DOM components.

```javascript
/** @jsx React.DOM */
var LinkButton = React.createClass({
  render: function() {
    return <a className="btn" />;
  }
});

var myButton = <LinkButton />;
```

This example defines a `LinkButton` component class using `React.createClass()`,
and its `render()` method composes the `<a>` DOM component.

### DOM Components <small>such as `div` and `span`.</small>

DOM components are the set of classes that correspond to browser DOM elements.
They are defined in `React.DOM` and can be brought "into scope" by setting
`@jsx React.DOM` in the docblock. See [JSX Syntax](syntax.html) for more
details.

Although `React.DOM` components look like browser DOM elements, they differ in a
few ways:

- All property names, including event handlers, are camelCased.
- JavaScript identifiers should be used, namely `className` and `htmlFor`.
- The `style` prop expects an object instead of a string. The object should map
  camelCased style properties to values, e.g. `{backgroundColor: '#fff'}`.

Here is an example of a React link styled as a button with a click handler:

```javascript
/** @jsx React.DOM */
var handleClick = function() {alert('Clicked!');};
var inlineStyle = {textDecoration: 'none'};

var myLink = <a className="btn" onClick={handleClick} style={inlineStyle} />;
```
