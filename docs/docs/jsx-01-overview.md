---
id: jsx-overview
title: JSX — Overview
permalink: jsx-overview.html
next: jsx-html-differences.html
redirect_from:
  - tips/maximum-number-of-jsx-root-nodes.html
  - tips/false-in-jsx.html
  - docs/jsx-in-depth.html
---

## What is JSX?

JSX is a small JavaScript syntax extension for React. It lets you **create JavaScript objects using an XML/HTML-like syntax.**

To generate a link in React using pure JavaScript you'd write:

```javascript
React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')
```

With **JSX** this becomes:

```javascript
<a href="https://facebook.github.io/react/">Hello!</a>
```

> Note:
>
> JSX is syntacticly similar to HTML, but with some [key differences](/react/docs/jsx-html-differences.html).
>
> Also, note React's [DOM differences](/react/docs/dom-differences.html). (Not specific to JSX, but important nonetheless.)

## Why JSX?

It can be a better alternative to **template languages**:

- It doesn't alter the semantics of JavaScript; it's a superset.
- It avoids abstractions of primitives; you can just use [JavaScript expressions](#javascript-expressions).
- It complements React's colocation of display logic and UI description, preventing cumbersome templates for complex logic.

It can be a better alternative to **function calls or object literals**:

- It has a concise and HTML-like syntax for defining tree structures with attributes.
- It's more familiar for casual developers such as designers.
- It has balanced opening and closing tags. This helps make large trees easier to read.

**But remember, it's entirely [optional](#react-without-jsx).**

## HTML Tags vs. React Components

React can either render HTML tags (strings) or React components (classes).

To render an HTML tag, just use **lower-case** tag names in JSX:

```javascript
var myDivElement = <div className="foo" />;
ReactDOM.render(myDivElement, document.getElementById('example'));
```

To render a React Component, just create a local variable that starts with an **upper-case** letter:

```javascript
var MyComponent = React.createClass({/*...*/});
var myElement = <MyComponent someProperty={true} />;
ReactDOM.render(myElement, document.getElementById('example'));
```


## React without JSX

You don't have to use JSX with React. You can create React elements in plain JavaScript using `React.createElement`, which takes a tag name or component, a properties object, and variable number of optional child arguments.

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

For convenience, you can create short-hand factory functions to create elements from custom components.

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

React already has built-in factories for common HTML tags:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```

## The Transform

React JSX transforms from an XML-like syntax into native JavaScript. XML elements, attributes and children are transformed into arguments that are passed to `React.createElement`.

```javascript
var Nav;
// Input (JSX):
var app = <Nav color="blue" />;
// Output (JS):
var app = React.createElement(Nav, {color:"blue"});
```

Notice that in order to use `<Nav />`, the `Nav` variable must be in scope.

JSX also allows specifying children using XML syntax:

```javascript
var Nav, Profile;
// Input (JSX):
var app = <Nav color="blue"><Profile>click</Profile></Nav>;
// Output (JS):
var app = React.createElement(
  Nav,
  {color:"blue"},
  React.createElement(Profile, null, "click")
);
```

JSX will infer the class's [displayName](/react/docs/component-specs.html#displayname) from the variable assignment when the displayName is undefined:

```javascript
// Input (JSX):
var Nav = React.createClass({ });
// Output (JS):
var Nav = React.createClass({displayName: "Nav", });
```

Use the [Babel REPL](https://babeljs.io/repl/) to try out JSX and see how it desugars into native JavaScript, and the [HTML to JSX converter](/react/html-jsx.html) to convert your existing HTML to JSX.

If you want to use JSX, the [Getting Started](/react/docs/getting-started.html) guide shows how to set up compilation.

Also, [Babel exposes a number of ways to get started using JSX](http://babeljs.io/docs/setup/), ranging from command line tools to Ruby on Rails integrations. Choose the tool that works best for you.

> Note:
>
> The JSX expression always evaluates to a ReactElement. The actual
> implementation details may vary. An optimized mode could inline the
> ReactElement as an object literal to bypass the validation code in
> `React.createElement`.


## JavaScript Expressions

### Attribute Expressions

To use a JavaScript expression as an attribute value, wrap the expression in a pair of curly braces (`{}`) instead of quotes (`""`).

```javascript
// Input (JSX):
var person = <Person name={window.isLoggedIn ? window.name : ''} />;
// Output (JS):
var person = React.createElement(
  Person,
  {name: window.isLoggedIn ? window.name : ''}
);
```

### Boolean Attributes

Omitting the value of an attribute causes JSX to treat it as `true`. To pass `false` an attribute expression must be used. This often comes up when using HTML form elements, with attributes like `disabled`, `required`, `checked` and `readOnly`.

```javascript
// These two are equivalent in JSX for disabling a button
<input type="button" disabled />;
<input type="button" disabled={true} />;

// And these two are equivalent in JSX for not disabling a button
<input type="button" />;
<input type="button" disabled={false} />;
```

#### "false" in JSX

Here's how `false` renders in different situations:

Renders as `id="false"`:

```js
ReactDOM.render(<div id={false} />, mountNode);
```

String `"false"` as input value:

```js
ReactDOM.render(<input value={false} />, mountNode);
```

No child:

```js
ReactDOM.render(<div>{false}</div>, mountNode);
```

The reason why this one doesn't render as the string `"false"` as a `div` child is to allow the more common use-case: `<div>{x > 1 && 'You have more than one item'}</div>`.

### Child Expressions

Likewise, JavaScript expressions may be used to express children:

```javascript
// Input (JSX):
var content = <Container>{window.isLoggedIn ? <Nav /> : <Login />}</Container>;
// Output (JS):
var content = React.createElement(
  Container,
  null,
  window.isLoggedIn ? React.createElement(Nav) : React.createElement(Login)
);
```

### Comments

It's easy to add comments within your JSX; they're just JS expressions. You just need to be careful to put `{}` around the comments when you are within the children section of a tag.

```javascript
var content = (
  <Nav>
    {/* child comment, put {} around */}
    <Person
      /* multi
         line
         comment */
      name={window.isLoggedIn ? window.name : ''} // end of line comment
    />
  </Nav>
);
```

> Note:
>
> `if/else` statements aren't supported in JSX, so you'll need to use expressions instead.
> [Read "JSX — Conditional Statements"](/react/docs/jsx-conditional-statements.html)

## Namespaced Components

If you are building a component that has many children, like a form, you might end up with something with a lot of variable declarations:

```javascript
// Awkward block of variable declarations
var Form = MyFormComponent;
var FormRow = Form.Row;
var FormLabel = Form.Label;
var FormInput = Form.Input;

var App = (
  <Form>
    <FormRow>
      <FormLabel />
      <FormInput />
    </FormRow>
  </Form>
);
```

To make it simpler and easier, *namespaced components* let you use one component that has other components as attributes:

```javascript
var Form = MyFormComponent;

var App = (
  <Form>
    <Form.Row>
      <Form.Label />
      <Form.Input />
    </Form.Row>
  </Form>
);
```

To do this, you just need to create your *"sub-components"* as attributes of the main component:

```javascript
var MyFormComponent = React.createClass({ ... });

MyFormComponent.Row = React.createClass({ ... });
MyFormComponent.Label = React.createClass({ ... });
MyFormComponent.Input = React.createClass({ ... });
```

JSX will handle this properly when compiling your code.

```javascript
var App = (
  React.createElement(Form, null,
    React.createElement(Form.Row, null,
      React.createElement(Form.Label, null),
      React.createElement(Form.Input, null)
    )
  )
);
```

## Root Nodes

Currently, in a component's `render`, you can only return one node; if you have, say, a list of `div`s to return, you must wrap your components within a `div`, `span` or any other component.

Don't forget that JSX compiles into regular JS; returning two functions doesn't really make syntactic sense. Likewise, don't put more than one child in a ternary.
