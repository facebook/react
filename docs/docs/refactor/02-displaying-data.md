# Displaying data

The most basic thing you can do with a UI is display some data. React makes it easy to display data, and automatically keeps it up-to-date when the data changes.

## Getting started

Let's look at a really simple example. Create a `hello-react.html` file with the following code:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React</title>
    <script src="http://fb.me/react-0.4.0.min.js"></script>
    <script src="http://fb.me/JSXTransformer-0.4.0.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">

      // ** Your code goes here! **

    </script>
  </body>
</html>
```

For the rest of the documentation, we'll just focus on the JavaScript code and assume it's inserted into a template like the one above. Replace the placeholder comment above with the following JS:

```javascript
/** @jsx React.DOM */

var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  React.renderComponent(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## Reactive updates

View the finished code in a web browser and type your name into the text field. Notice that React is only changing the time string in the UI -- any input you put in the text field remains, even though you haven't written any code to manage this behavior. React figures it out for you and does the right thing.

## JSX syntax

We strongly believe that components are the right way to separate concerns rather than "templates" and "display logic." We think that markup and the code that generates it are intimately tied together. Additionally, display logic is often very complex and using template languages to express it becomes cumbersome.

We've found that the best solution for this problem is to generate markup directly from the JavaScript code such that you can use all of the expressive power of a real programming language to build UIs. In order to make this easier, we've added a *very* simple, **optional** HTML-like syntax for the function calls that generate markup called JSX.

### Don't use JSX if you don't like it!

React works out of the box without JSX. Simply construct your markup using the
functions on `React.DOM`. For example, here's how to construct a simple link:

```javascript
var link = React.DOM.a({href: 'http://facebook.github.io/react'}, 'React');
```

However, we recommend using JSX for many reasons:

- It's easier to visualize the structure of the DOM.
- Designers are more comfortable making changes.
- It's familiar for those who have used MXML or XAML.

### The Transform

JSX transforms XML-like syntax into native JavaScript. It turns XML elements and
attributes into function calls and objects, respectively.

```javascript
var Nav;
// Input (JSX):
var app = <Nav color="blue" />;
// Output (JS):
var app = Nav({color:'blue'}, null);
```

Notice that in order to use `<Nav />`, the `Nav` variable must be in scope.

JSX also allows specifying children using XML syntax:

```javascript
var Nav, Profile;
// Input (JSX):
var app = <Nav color="blue"><Profile>click</Profile></Nav>;
// Output (JS):
var app = Nav({color:'blue'}, Profile(null, 'click'));
```

Use the [JSX Compiler](/react/jsx-compiler.html) to try out JSX and see how it
desugars into native JavaScript.

If you want to use JSX, the [Getting Started](getting-started.html) guide shows
how to setup compilation.

> Note:
>
> Details about the code transform are given here to increase understanding, but
> your code should not rely on these implementation details.

### React and JSX

React and JSX are independent technologies, but JSX was primarily built with
React in mind. The two valid uses of JSX are:

- To construct instances of React DOM components (`React.DOM.*`).
- To construct instances of composite components created with
  `React.createClass()`.

**React DOM Components**

To construct a `<div>` is to create a variable that refers to `React.DOM.div`.

```javascript
var div = React.DOM.div;
var app = <div className="appClass">Hello, React!</div>;
```

**React Component Components**

To construct an instance of a composite component, create a variable that
references the class.

```javascript
var MyComponent = React.createClass({/*...*/});
var app = <MyComponent someProperty={true} />;
```

See [Component Basics](component-basics.html) to learn more about components.

> Note:
>
> Since JSX is JavaScript, identifiers such as `class` and `for` are discouraged
> as XML attribute names. Instead, React DOM components expect attributes like
> `className` and `htmlFor`, respectively.

### DOM Convenience

Having to define variables for every type of DOM element can get tedious
(e.g. `var div, span, h1, h2, ...`). JSX provides a convenience to address this
problem by allowing you to specify a variable in an `@jsx` docblock field. JSX
will use that field to find DOM components.

```javascript
/**
 * @jsx React.DOM
 */
var Nav;
// Input (JSX):
var tree = <Nav><span /></Nav>;
// Output (JS):
var tree = Nav(null, React.DOM.span(null, null));
```

> Remember:
>
> JSX simply transforms elements into function calls and has no notion of the
> DOM. The docblock parameter is only a convenience to resolve the most commonly
> used elements. In general, JSX has no notion of the DOM.

### JavaScript Expressions

#### Attribute Expressions

To use a JavaScript expression as an attribute value, wrap the expression in a
pair of curly braces (`{}`) instead of quotes (`""`).

```javascript
// Input (JSX):
var person = <Person name={window.isLoggedIn ? window.name : ''} />;
// Output (JS):
var person = Person({name: window.isLoggedIn ? window.name : ''});
```

#### Child Expressions

Likewise, JavaScript expressions may be used to express children:

```javascript
// Input (JSX):
var content = <Container>{window.isLoggedIn ? <Nav /> : <Login />}</Container>;
// Output (JS):
var content = Container(null, window.isLoggedIn ? Nav(null, null) : Login(null, null));
```

### Tooling

Beyond the compilation step, JSX does not require any special tools.

- Many editors already include reasonable support for JSX (Vim, Emacs js2-mode).
- Linting provides accurate line numbers after compiling without sourcemaps.
- Elements use standard scoping so linters can find usage of out-of-scope
  components.

### Prior Work

JSX is similar to several other JavaScript embedded XML language
proposals/projects. Some of the features of JSX that distinguish it from similar
efforts include:

- JSX is a simple syntactic transform.
- JSX neither provides nor requires a runtime library.
- JSX does not alter or add to the semantics of JavaScript.
