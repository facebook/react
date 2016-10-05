---
id: introducing-jsx
title: Introducing JSX
permalink: docs/introducing-jsx.html
prev: hello-world.html
next: rendering-elements.html
---

Consider this variable declaration:

```js
let element = <h1>Hello, world!</h1>;
```

This funny tag syntax is neither a string nor HTML.

It is called JSX, and it is a syntax extension to JavaScript. We recommend using it with React to describe what the UI should look like. JSX may remind you of a template language, but it comes with a full power of JavaScript.

>**Note:**
>
>Many people get turned off by JSX the first time they see it. One might think it violates separation of concerns but we believe [otherwise](https://www.youtube.com/watch?v=x7cQ3mrcKaY).
>
>We encourage you to [give it five minutes](https://signalvnoise.com/posts/3124-give-it-five-minutes). Facebook and many other companies successfully use it in production both for simple and complex apps.
>
>Also note that JSX is optional, and you can [use React without JSX](/react/docs/react-without-jsx.html).

### Embedding Expressions in JSX

JSX comes with a full power of JavaScript.

You can embed any [JavaScript expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#Expressions) in JSX by wrapping it in the curly braces.

For example, `2 + 2`, `user.name`, and `formatName(user)` are all valid expressions:

```js{12}
function formatName(user) {
  return user.firstName + ' ' + user.lastName;
}

let user = {
  firstName: 'Harper',
  lastName: 'Perez'
};

let element = (
  <h1>
    Hello, {formatName(user)}!
  </h1>
);
```

**[Try it on Codepen.](http://codepen.io/gaearon/pen/PGEjdG?editors=0010)**

Note that we wrapped JSX in parens and split it over multiple lines for readability.

>**Caveat:**
>
>You can't use `if` or `for` statements *inside* of JSX because they are not [expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#Expressions).

### JSX is an Expression Too

After compilation, JSX expressions become regular JavaScript objects.

This means that you can use JSX inside of `if` statements and `for` loops, assign it to variables, accept it as arguments, and return it from functions:

```js{3,5}
function getGreeting(user) {
  if (user) {
    return <h1>Hello, {formatName(user.name)}!</h1>;
  } else {
    return <h1>Hello, Stranger.</h1>;
  }
}
```

### Specifying Attributes with JSX

You may use quotes to specify string literals as attributes:

```js
let element = <div tabIndex="0"></div>;
```

You may also use the curly braces to embed a JavaScript expression in an attribute:

```js
let element = <img src={user.avatarUrl}></img>;
```

### Specifying Children with JSX

If a tag is empty, you may close it immediately with `/>`, like in XML:

```js
let element = <img src={user.avatarUrl} />;
```

JSX tags may contain children:

```js
let element = (
  <div>
    <h1>Hello!</h1>
    <h2>Good to see you here.</h2>
  </div>
);
```

>**Caveat:**
>
>Since JSX is closer to JavaScript than HTML, it uses property names as defined in the DOM specification rather than HTML attribute names.
>
>For example, `class` becomes [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) in JSX, and `tabindex` becomes [`tabIndex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex). The convention is to use `camelCase` attribute names, just like properties in JavaScript.

### JSX Represents Objects

Babel compiles JSX down to `React.createElement()` calls.

These two examples are identical:

```js
let element = (
  <h1 className="greeting">
    Hello, world!
  </h1>
);
```

```js
let element = React.createElement(
  'h1',
  {className: 'greeting'},
  'Hello, world!'
);
```

We will get to what "React elements" are in the next section. For now, you can think of them as descriptions of what you want to see on the screen.

`React.createElement()` performs a few checks to help you write bug-free code but essentially it creates an object like this:

```js
// Note: this structure is simplified
let element = {
  type: 'h1',
  props: {
    className: 'greeting',
    children: 'Hello, world'
  }
};
```

React later reads these objects and uses them to construct the DOM and keep it up to date.

>**Caveat:**
>
>Every tag becomes a function call so you can't leave two tags without a parent.
>
>```js
// JSX compilation error:
// "Adjacent JSX elements must be wrapped in an enclosing tag"
let element = (
  <h1>Hello!</h1>
  <h2>Good to see you here.</h2>
);
```
>
>We can fix it by adding a root tag to the JSX expression:
>
>```js{2,5}
let element = (
  <div>
    <h1>Hello!</h1>
    <h2>Good to see you here.</h2>
  </div>
);
```

### JSX Prevents Injection Attacks

It is important to stress that JSX produces objects rather than string literals.

This is why it is safe to embed user input in it:

```js
let title = response.potentiallyMaliciousInput;
// This is safe:
let element = <h1>{title}</h1>;
```

React will escape any values embedded in JSX before rendering them.

### Learn More About JSX

This is enough JSX knowledge to get you started.

You can learn more about it from these two advanced guides:

* [JSX in Depth](/react/docs/jsx-in-depth.html).

* [React without JSX](/react/docs/react-without-jsx.html).

We recommend searching for a "Babel" syntax scheme for your editor of choice so that both ES6 and JSX code is properly highlighted.
