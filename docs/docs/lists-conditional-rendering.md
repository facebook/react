---
id: forms
title: Lists & Conditional Rendering
permalink: docs/lists-conditional-rendering.html
prev: 
next: 
---

## Lists

First, let's review how you transform lists in Javascript.

Given the code below, we use the `map()` function to take an array of `numbers`, double their values, and then assigned the new array to the variable `doubled`.

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((number) => number * 2) // result: [2, 4, 6, 8, 10]
```

In React, transforming arrays into lists of [elements](/react/docs/rendering-elements.html) is nearly identical.

### Rendering Multiple Components

You can build collections of elements and include them in [JSX](/react/docs/introducing-jsx.html) using curly braces `{}`, similar to embedding values with Javascript.

Below, we loop through the `numbers` array using the Javascript [`map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) function. We return an `<li>` element for each item. Finally, we assign the resulting array of items to `listItems`. In `ReactDOM.render()` we render the entire `{listItems}` array inside a `<ul>` element.

```javascript
const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((item) =>
  <li>
    {item}
  </li>
)
ReactDOM.render(
  <ul>{listItems}</ul>,
  document.getElementById('root')
);
```

[Try it out on Codepen.](https://codepen.io/ericnakagawa/pen/wzxEmv/?editors=0011)

### Basic List Component

We can refactor the previous example into a [functional component](http://localhost:4000/react/docs/components-and-props.html) that accepts an array of `numbers` and outputs an unordered list of elements.

```javascript
function NumberList(props) {
  const numbers = props.numbers
  const listItems = numbers.map((item) =>
    <li>
      {item}
    </li>
  )
  return <ul>{listItems}</ul>
}

const numbers = [1, 2, 3, 4, 5];
ReactDOM.render(
  <NumberList numbers={numbers} />,
  document.getElementById('root')
);
```

When you run this code, you'll be given a warning that a key should be provided for list items. Keys should be included when creating lists of elements.

Let's assign a `key` to our list items inside `numbers.map()` and fix the missing key issue.

```javascript{4}
function NumberList(props) {
  const numbers = props.numbers
  const listItems = numbers.map((item) =>
    <li key={"item-" + item}>
      {item}
    </li>
  )
  return <ul>{listItems}</ul>
}

const numbers = [1, 2, 3, 4, 5];
ReactDOM.render(
  <NumberList numbers={numbers} />,
  document.getElementById('root')
);
```

[Try it out on Codepen.](https://codepen.io/ericnakagawa/pen/gwjdzN?editors=0011)


### Keys

Keys help React identify which items have changed, are added, or are removed.

Keys should be given to the elements inside the array to give the elements a stable identity. If you extract a `Number` component, you should keep the key on the `<Number />` elements in the array rather than on the root `<li>` element in the `Number` itself.

Keys serve as a hint to React but they don't get passed to your components. If you need the same value in your component, pass it explicitly as a prop with a different name.

Keys used within groups should be unique to each other.

**Example: Incorrect key usage:** _Should not assign a `key` in this manner._

```javascript{2}
function Number(props) {
  return <li key={"item-" + props.value}>{props.value}</li>;
}

function NumberList(props) {
  const numbers = props.numbers
  return <ul>{numbers.map((item) => <Number value={item} />}</ul>
}

const numbers = [1, 2, 3, 4, 5];
ReactDOM.render(<NumberList numbers={numbers} />, document.getElementById('root'));
```

**Example: Correct key usage:** _Assigns `key` inside `map()` function._

```javascript{9}
function Number(props) {
  return <li>{props.value}</li>;
}

function NumberList(props) {
  const numbers = props.numbers
  return (
    <ul>
    {numbers.map((item) => <Number key={"item-" + item} value={item} />)}
    </ul>
  )
}

const numbers = [1, 2, 3, 4, 5];
ReactDOM.render(
  <NumberList numbers={numbers} />,
  document.getElementById('root')
);
```

[Try it out on Codepen.](https://codepen.io/ericnakagawa/pen/zKmJWK?editors=0010)

## Conditional Rendering

In React, you can create distinct components that encapsulate behavior you need. Then, you can render only the specific component you need, depending on the state of your application.

In this example, we pass the variable `loggedIn` representing our state, together with `&&` operator, and the component we wish to render. Depending on the value of `loggedIn` the corresponding component will be rendered.

```javascript
function UserGreeting(props) {
  return <div>Welcome back!</div>
}
function GuestGreeting(props) {
  return <div>Please sign up.</div>
}
function VisitorMessage(props) {
  var loggedIn = true; // change this to false
  return (
    <div>
      {loggedIn && <UserGreeting />}
      {!loggedIn && <GuestGreeting />}
    </div>
  );
}

ReactDOM.render(<VisitorMessage />, document.getElementById('root'));
```

[Try it out on Codepen](https://codepen.io/ericnakagawa/pen/WGaKLy?editors=0011#0)


### Element Variables

You can use variables to store elements. This can help you render the specific element you need based on the state of your application.

In the example below, we want to display a login or logout button. In `render()` we check `state.loggedIn` and assign to `button` either `<LoginButton />` or `<LogoutButton />`. We then render the element.

```javascript{23,25,29}
function LogoutButton(props) {
  return <button onClick={props.onClick}>Logout</button>
}

function LoginButton(props) {
  return <button onClick={props.onClick}>Login</button>
}

class LoginControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loggedIn: true};
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
  }
  handleLoginClick() {
    this.setState({loggedIn: true});
  }
  handleLogoutClick() {
    this.setState({loggedIn: false});
  }
  render() {
    let button = <LoginButton onClick={this.handleLoginClick} />;
    if (this.state.loggedIn) {
      button = <LogoutButton onClick={this.handleLogoutClick} />;
    }
    return (
      <div>
        {button}
      </div>
    );
  }
}

ReactDOM.render(<LoginControl />, document.getElementById('root'));
```

[Try it out on Codepen.](https://codepen.io/ericnakagawa/pen/Egpdrz?editors=0010)

### Inline If-Else With Ternary Operators

Another method for conditionally rendering elements inline is to use the Javascript ternary operator `(condition) ? true : false`.

In the example below, we demonstrate how to use the ternary operator to conditionally render a small block of text.

```javascript
render() {
  var loggedIn = false;
  return (
    <div>
      The user is <strong>{loggedIn?'currently':'not'}</strong> logged in.
    </div>
  );
}
```

### Prevent Component Rendering

In rare cases you may want to prevent a child component from rendering completely. To do this return `null` or `false` from the `render()` function.

In the example below, the `<WarningBanner />` is rendered depending on the value of the prop `warn`. If the value of the prop is false, then the component does not render.

The highlighted lines below show where the component `<WarningBanner />` returns null and the component isn't rendered.

```javascript{2}
function WarningBanner(props) {
  if(!props.warn) return null;
  return <div className="warning">Warning!</div>
}

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showWarning: true}
    this.toggleWarning = this.toggleWarning.bind(this);
  }
  toggleWarning() {
    this.setState(prevState => ({
      showWarning: !prevState.showWarning
    }));
  }
  render() {
    return (
      <div>
        <WarningBanner warn={this.state.showWarning} />
        <button onClick={this.toggleWarning}>
          {!this.state.showWarning?"show":"hide"}
        </button>
      </div>
    );
  }
}

ReactDOM.render(<Page />, document.getElementById('root'));
```

[Try it out on Codepen.](https://codepen.io/ericnakagawa/pen/ozragV?editors=0011#0)

