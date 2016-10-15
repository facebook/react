---
id: forms
title: Lists & Conditional Rendering
permalink: docs/lists-conditional-rendering.html
prev: 
next: 
---

## Lists

First, let's talk about transforming lists in Javascript.

Given the code below, we use the `map()` function to take an array of `numbers`, double their values, and then output them to a new array `doubled`.

```javascript
const numbers = [1, 2, 3, 4, 5];
numbers.map((number) => number * 2); // outputs: [2, 4, 6, 8 10]
```

In React, transforming arrays into lists of elements is nearly identical.

### Basic List

A component must return only a single item. If you are returning multiple elements, wrap them in `<div></div>`.

Here we take our list of `numbers` and generate a collection of `<li>` elements. We are using the plain Javascript `map()` function. Learn more about it <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map">here</a>.

```javascript
class Numbers extends React.Component {
  render() {
    const numbers = [1, 2, 3, 4, 5];
    return (
      <div>
        <ul>
          {numbers.map((number) => <li>{number}</li>)}
        </ul>
      </div>
    );
  }
}
```

<a target="_blank" href="https://codepen.io/ericnakagawa/pen/wzxEmv/?editors=0011">Try it out on Codepen.</a>

If you run this code, you'll be given a warning that you should provide a key for list items. Keys are important and you should include them when creating lists of elements.

Let's refactor this code to replace our `<li>` element with a [functional component]() and provide it a `key` and fix the missing key issue. 

```javascript
function Number(props) {
  return <li>{props.value}</li>  
}
function Numbers(props) {
  const numbers = [1, 2, 3, 4, 5];
  return (
    <div>
      <ul>
        {numbers.map((number, index) => <Number key={index} value={number} />)}
      </ul>
    </div>
  );
}
```

<a target="_blank" href="https://codepen.io/ericnakagawa/pen/gwjdzN?editors=0011">Try it out on Codepen.</a>


### Keys

In the previous example we provide the index of an item in our array as our `key`. It is important to always provide keys to your lists of elements.

* For lists that are unlikely or won't change, using an item index is fine.
* For lists that may change, it is important to use a unique key. A string representing identity of the data item can also work.

* Keys should be unique amongst siblings. This means that the keys used with groups of related elements in a list should be unique .
* You will be warned when you don't include keys.

#### Performance

In React, the absence of keys on an element can impact your application performance.

When a `key` is provided, React chooses the most performant method for updating the rendered objects.

#### Example 1

Given the HTML below:

```html
<ul>
  <li>1</li> /* key: "1" */
  <li>2</li> /* key: "2" */
</ul>
```

In the event that the element containing "2" needs to be removed, React will hide the element instead of removing the object entirely like so:

```html
<ul>
  <li>1</li> /* key: "1" */
  <li style={display: 'none'}>2</li> /* key: "2" */
</ul>
```

#### Example 2

Given the html below:

```html
<ul>
  <li>1</li> /* key: "1" */
  <li>2</li> /* key: "2" */
</ul>
```

In the event that the element "1" needs to be removed, React will swap the text and hide the second element like so:

```html
<ul>
  <li>2</li> /* key: "2" */
</ul>
```

## Conditional Rendering

With React you can render distinct components depending on the value of your data. This means no longer needing to manually modify the CSS classes of HTML elements. Instead, you create distinct components that encapsulate behavior you need. Then, render only the specific component you need depending on the state of your application.

This follows the concept of "separation of concerns" by allowing each component to manage how it should be rendered.

### Element Variables

Given the current state of your application you can assign elements as the value of variables, then only render the needed element.

In the example below we have a stateful component named `<LoginControl />`. We use a boolean value `this.state.loggedIn` to track if the user is logged in. If logged in, we want to render `<LogoutButton />`. If logged out, we want to render `<LoginButton />`. Depending on the value of `this.state.loggedIn`, we use `loginButton` to hold the element.

The highlighted lines below show where `loginControlButton` is created and set to a default value of "`<LoginButton />`", then where it conditionally gets changed depending on current state, and finally where `{loginControlButton}` is rendered.

```javascript{21,23,27}
function LogoutButton(props) {
  return <button onClick={props.click}>Logout</button>
}
function LoginButton(props) {
  return <button onClick={props.click}>Login</button>
}
class LoginControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loggedIn: true}
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
  }
  login() {
    this.setState({loggedIn: true,});
  }
  logout() {
    this.setState({loggedIn: false});
  }
  render() {
    var loginControlButton = <LoginButton click={this.login} />;
    if (this.state.loggedIn) {
      loginControlButton = <LogoutButton click={this.logout} />;
    }
    return (
      <div>
        {loginControlButton}
      </div>
    );
  }
}

```

<a target="_blank" href="https://codepen.io/ericnakagawa/pen/Egpdrz?editors=0010">Try it out on Codepen.</a>


### Prevent Component Rendering

In some cases, you will not want a component to render. To prevent components from rendering, return `null` or `false` from the `render()` function.

In the example below, a `<Page />` component renders a child `<WarningBanner />` element and a button. The button calls `this.toggleWarning` to switch the value of `this.state.showWarning`. If the `this.state.showWarning` is false, then nothing will be rendered.

The highlighted lines below show where the variable `warningBanner` is set to a default value of null and then where it is rendered in `return()`.

```javascript{17,23}
function WarningBanner(props) {
  return <div className="warning">Warning!</div>
}
class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showWarning: true, toggleText: "hide"}
    this.toggleWarning = this.toggleWarning.bind(this);
  }
  toggleWarning() {
    this.setState({
      showWarning: !this.state.showWarning,
      toggleText: !this.state.showWarning?"hide":"show"
    });
  }
  render() {
    let warningBanner = null;
    if (this.state.showWarning) {
      warningBanner = <WarningBanner />;
    }
    return (
      <div>
        {warningBanner}
        <button onClick={this.toggleWarning}>{this.state.toggleText}</button>
      </div>
    );
  }
}
```

<a target="_blank" href="https://codepen.io/ericnakagawa/pen/ozragV?editors=0011#0">Try it out on Codepen.</a>

### Rendering Multiple Components Using {}

You can build collections of components and include them in <a target="_blank" href="/react/docs/introducing-jsx.html">JSX</a> with curly braces `{}` just as you would embed values with Javascript.

In the example below we take an array of data `numbers`. Next, we add multiple `<Number />` components to the array.

Then, in the `render()` function we render the entire `numbers` array by wrapping in curly braces `{numbers}`.

```javascript
function Number(props) {
  return (
    <li>{this.props.number}</li>
  );
}

function Number(props) {
  let numbers = [];
  numbers.push(<Number value="1" />)
  numbers.push(<Number value="2" />)
  numbers.push(<Number value="3" />)
  numbers.push(<Number value="4" />)
  numbers.push(<Number value="5" />)
  return (
    <div>
      <ul>
        {numbers}
      </ul>
    </div>
  );
}
```

### Inline If-Else With Ternary Operators

Another method for conditionally rendering elements inline is to use the Javascript ternary operator `(condition) ? true : false`.

In the example below, we demonstrate how to use the ternary operator to conditionally render a small block of text.

```javascript
render() {
  var loggedIn = false;
  return (
    <div>
      The user is <strong>{(loggedIn)?'currently':'not'}</strong> logged in.
    </div>
  );
}
```

