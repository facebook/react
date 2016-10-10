---
id: reusable-components
title: Reusable Components
permalink: docs-old/reusable-components.html
prev: multiple-components.html
next: transferring-props.html
---

When designing interfaces, break down the common design elements (buttons, form fields, layout components, etc.) into reusable components with well-defined interfaces. That way, the next time you need to build some UI, you can write much less code. This means faster development time, fewer bugs, and fewer bytes down the wire.

## Prop Validation

As your app grows it's helpful to ensure that your components are used correctly. We do this by allowing you to specify `propTypes`. `React.PropTypes` exports a range of validators that can be used to make sure the data you receive is valid. When an invalid value is provided for a prop, a warning will be shown in the JavaScript console. Note that for performance reasons `propTypes` is only checked in development mode.

You can assign a special property to a component to declare its `propTypes`:

```javascript
class Greeting extends React.Component {
  render() {
    return (
      <h1>Hello, {this.props.name}</h1>
    );
  }
}

Greeting.propTypes = {
  name: React.PropTypes.string
};
```

Here is an example documenting the different validators provided:

```javascript
MyComponent.propTypes = {
  // You can declare that a prop is a specific JS primitive. By default, these
  // are all optional.
  optionalArray: React.PropTypes.array,
  optionalBool: React.PropTypes.bool,
  optionalFunc: React.PropTypes.func,
  optionalNumber: React.PropTypes.number,
  optionalObject: React.PropTypes.object,
  optionalString: React.PropTypes.string,
  optionalSymbol: React.PropTypes.symbol,

  // Anything that can be rendered: numbers, strings, elements or an array
  // (or fragment) containing these types.
  optionalNode: React.PropTypes.node,

  // A React element.
  optionalElement: React.PropTypes.element,

  // You can also declare that a prop is an instance of a class. This uses
  // JS's instanceof operator.
  optionalMessage: React.PropTypes.instanceOf(Message),

  // You can ensure that your prop is limited to specific values by treating
  // it as an enum.
  optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

  // An object that could be one of many types
  optionalUnion: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
    React.PropTypes.instanceOf(Message)
  ]),

  // An array of a certain type
  optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

  // An object with property values of a certain type
  optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

  // An object taking on a particular shape
  optionalObjectWithShape: React.PropTypes.shape({
    color: React.PropTypes.string,
    fontSize: React.PropTypes.number
  }),

  // You can chain any of the above with `isRequired` to make sure a warning
  // is shown if the prop isn't provided.
  requiredFunc: React.PropTypes.func.isRequired,

  // A value of any data type
  requiredAny: React.PropTypes.any.isRequired,

  // You can also specify a custom validator. It should return an Error
  // object if the validation fails. Don't `console.warn` or throw, as this
  // won't work inside `oneOfType`.
  customProp: function(props, propName, componentName) {
    if (!/matchme/.test(props[propName])) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to' +
        ' `' + componentName + '`. Validation failed.'
      );
    }
  },

  // You can also supply a custom validator to `arrayOf` and `objectOf`.
  // It should return an Error object if the validation fails. The validator
  // will be called for each key in the array or object. The first two
  // arguments of the validator are the array or object itself, and the
  // current item's key.
  customArrayProp: React.PropTypes.arrayOf(function(propValue, key, componentName, location, propFullName) {
    if (!/matchme/.test(propValue[key])) {
      return new Error(
        'Invalid prop `' + propFullName + '` supplied to' +
        ' `' + componentName + '`. Validation failed.'
      );
    }
  })
};
```

### Single Child

With `React.PropTypes.element` you can specify that only a single child can be passed to a component as children.

```javascript
class MyComponent extends React.Component {
  render() {
    // This must be exactly one element or it will warn.
    var children = this.props.children;
    return (
      <div>
        {children}
      </div>
    );
  }
}

MyComponent.propTypes = {
  children: React.PropTypes.element.isRequired
};
```

## Default Prop Values

React lets you define default values for your `props` in a very declarative way:

```javascript
class Greeting extends React.Component {
  render() {
    return (
      <h1>Hello, {this.props.name}</h1>
    );
  }
}

// Specifies the default values for props:
Greeting.defaultProps = {
  name: 'Stranger'
};

// Renders "Hello, Stranger":
ReactDOM.render(
  <Greeting />,
  document.getElementById('example')
);
```

The `defaultProps` will be used to ensure that `this.props.name` will have a value if it was not specified by the parent component. This allows you to safely just use your props without having to write repetitive and fragile code to handle that yourself.

## Transferring Props: A Shortcut

A common type of React component is one that extends a basic HTML element in a simple way. Often you'll want to copy any HTML attributes passed to your component to the underlying HTML element. To save typing, you can use the JSX _spread_ syntax to achieve this:

```javascript
class CheckLink extends React.Component {
  render() {
    // This takes any props passed to CheckLink and copies them to <a>
    return (
      <a {...this.props}>{'√ '}{this.props.children}</a>
    );
  }
}

ReactDOM.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## Stateless Functions

If a component doesn't use local state or lifecycle hooks, you can define it as a function instead of a class:

```javascript
function Greeting(props) {
  return <h1>Hello, {props.name}</h1>;
}

ReactDOM.render(
  <Greeting name="Sebastian" />,
  document.getElementById('example')
);
```

Or using the new ES6 arrow syntax:

```javascript
const Greeting = (props) => (
  <h1>Hello, {props.name}</h1>
);

ReactDOM.render(
  <Greeting name="Sebastian" />,
  document.getElementById('example')
);
```

This simplified component API is intended for components that are pure functions of their props. These components must not retain internal state, do not have backing instances, and do not have the component lifecycle methods. They are pure functional transforms of their input, with zero boilerplate.

However, you may still specify `.propTypes` and `.defaultProps` by setting them as properties on the function, just as you would set them on an ES6 class:

```javascript
function Greeting(props) {
  return (
    <h1>Hello, {props.name}</h1>
  );
}

Greeting.propTypes = {
  name: React.PropTypes.string
};

Greeting.defaultProps = {
  name: 'John Doe'
};

ReactDOM.render(
  <Greeting name="Mădălina"/>,
  document.getElementById('example')
);
```

>**Note:**
>
> Because stateless functions don't have a backing instance, you can't attach a ref to a stateless function component. Normally this isn't an issue, since stateless functions do not provide an imperative API. Without an imperative API, there isn't much you could do with an instance anyway. However, if a user wants to find the DOM node of a stateless function component, they must wrap the component in a stateful component (eg. ES6 class component) and attach the ref to the stateful wrapper component.

In an ideal world, many of your components would be stateless functions. In the future we plan to make performance optimizations specific to these components by avoiding unnecessary checks and memory allocations.

When you don't need local state or lifecycle hooks in a component, we recommend declaring it with a function. Otherwise, we recommend to use the ES6 class syntax.

## ES6 Classes and React.createClass()

Normally you would define a React component as a plain JavaScript class:

```javascript
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

If you don't use ES6 yet, you may use the `React.createClass` helper instead:


```javascript
var Greeting = React.createClass({
  render: function() {
    return <h1>Hello, {this.props.name}</h1>;
  }
});
```

The API of ES6 classes is similar to `React.createClass` with a few exceptions. These are covered in [Using React without ES6](/react/docs/react-without-es6.html).
