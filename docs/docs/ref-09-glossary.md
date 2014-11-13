---
id: glossary
title: React (Virtual) DOM Terminology
permalink: glossary.html
prev: reconciliation.html
---

In React's terminology, there are five core types that are important to distinguish:

- [ReactElement / ReactElement Factory](#react-elements)
- [ReactNode](#react-nodes)
- [ReactComponent / ReactComponent Class](#react-components)

## React Elements

The primary type in React is the `ReactElement`. It has four properties: `type`, `props`, `key` and `ref`. It has no methods and nothing on the prototype.

You can create one of these object through `React.createElement`.

```javascript
var root = React.createElement('div');
```

To render a new tree into the DOM, you create `ReactElement`s and pass them to `React.render` along with a regular DOM `Element` (`HTMLElement` or `SVGElement`). `ReactElement`s are not to be confused with DOM `Element`s. A `ReactElement` is a light, stateless, immutable, virtual representation of a DOM `Element`. It is a virtual DOM.

```javascript
React.render(root, document.body);
```

To add properties to a DOM element, pass a properties object as the second argument and children to the third argument.

```javascript
var child = React.createElement('li', null, 'Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child);
React.render(root, document.body);
```

If you use React JSX, then these `ReactElement`s are created for you. So this is equivalent:

```javascript
var root = <ul className="my-list">
             <li>Text Content</li>
           </ul>;
React.render(root, document.body);
```

__Factories__

A `ReactElement`-factory is simply a function that generates a `ReactElement` with a particular `type` property. React has a built-in helper for you to create factories. It's effectively just:

```javascript
function createFactory(type){
  return React.createElement.bind(null, type);
}
```

It allows you to create a convenient short-hand instead of typing out `React.createElement('div')` all the time.

```javascript
var div = React.createFactory('div');
var root = div({ className: 'my-div' });
React.render(root, document.body);
```

React already have built-in factories for common HTML tags:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```

If you are using JSX you have no need for factories. JSX already provides a convenient short-hand for creating `ReactElement`s.


## React Nodes

A `ReactNode` can be either:
- `ReactElement`
- `string` (aka `ReactText`)
- `number` (aka `ReactText`)
- Array of `ReactNode`s (aka `ReactFragment`)

These are used as properties of other `ReactElement`s to represent children. Effectively they create a tree of `ReactElement`s.


## React Components

You can use React using only `ReactElement`s but to really take advantage of React, you'll want to use `ReactComponent`s to create encapsulations with embedded state.

A `ReactComponent` Class is simply just a JavaScript class (or "constructor function").

```javascript
var MyComponent = React.createClass({
  render: function() {
    ...
  }
});
```

When this constructor is invoked it is expected to return an object with at least a `render` method on it. This object is referred to as a `ReactComponent`.

```javascript
var component = new MyComponent(props); // never do this
```

Other than for testing, you would normally __never__ call this constructor yourself. React calls it for you.

Instead, you pass the `ReactComponent` Class to `createElement` you get a `ReactElement`.

```javascript
var element = React.createElement(MyComponent);
```

OR using JSX:

```javascript
var element = <MyComponent />;
```

When this is passed to `React.render`, React will call the constructor for you and create a `ReactComponent`, which returned.

```javascript
var component = React.render(element, document.body);
```

If you keep calling `React.render` with the same type of `ReactElement` and the same container DOM `Element` it always returns the same instance. This instance is stateful.

```javascript
var componentA = React.render(<MyComponent />, document.body);
var componentB = React.render(<MyComponent />, document.body);
componentA === componentB; // true
```

This is why you shouldn't construct your own instance. Instead, `ReactElement` is a virtual `ReactComponent` before it gets constructed. An old and new `ReactElement` can be compared to see if a new `ReactComponent` instance is created or if the existing one is reused.

The `render` method of a `ReactComponent` is expected to return another `ReactElement`. This allows these components to be composed. Ultimately the render resolves into `ReactElement` with a `string` tag which instantiates a DOM `Element` instance and inserts it into the document.


## Formal Type Definitions

__Entry Point__

```
React.render = (ReactElement, HTMLElement | SVGElement) => ReactComponent;
```

__Nodes and Elements__

```
type ReactNode = ReactElement | ReactFragment | ReactText;

type ReactElement = ReactComponentElement | ReactDOMElement;

type ReactDOMElement = {
  type : string,
  props : {
    children : ReactNodeList,
    className : string,
    etc.
  },
  key : string | boolean | number | null,
  ref : string | null
};

type ReactComponentElement<TProps> = {
  type : ReactClass<TProps>,
  props : TProps,
  key : string | boolean | number | null,
  ref : string | null
};

type ReactFragment = Array<ReactNode | ReactEmpty>;

type ReactNodeList = ReactNode | ReactEmpty;

type ReactText = string | number;

type ReactEmpty = null | undefined | boolean;
```

__Classes and Components__

```
type ReactClass<TProps> = (TProps) => ReactComponent<TProps>;

type ReactComponent<TProps> = {
  props : TProps,
  render : () => ReactElement
};
```

