---
id: forms
title: Loops & Conditional Rendering
permalink: docs/loops-conditional-rendering.html
prev: 
next: 
---


## Lists

### A Basic List

To render an array or collection of objects into a list use the ES6 `map()`.

```javascript
render() {
  let persons = ['Ben', 'Chris', 'Dan', 'Paul', 'Tom'];
  return (
    <div>
      <ul>
        {persons.map((person) => {
          return (
            <li>{person}</li>
          );
        })}
      </ul>
    </div>
  );
}
```
> Using a fat arrow function (`() => {}`) will automatically bind `this` to the function.

### A Basic List Using Keyed Components

In this example we loop through a collection of objects, then pass props to a `Person` component. In our `map()` function we provide a second argument `index` that provides us with the current index of our loop. We use this index as our key, however more complex data benefits from a unique identifier (like a database object id).

```javascript
class Person extends Component {
  render() {
    return (
      <li>{this.props.name} likes the color {this.props.color}.</li>
    );
  }
}
class Persons extends Component {
  render() {
    let persons = [
      {name: 'Ben', color: 'red'},
      {name: 'Chris', color: 'green'},
      {name: 'Dan', color: 'blue'},
      {name: 'Paul', color: 'orange'},
      {name: 'Tom', color: 'yellow'}
    ];
    return (
      <div>
        <ul>
          {persons.map((person, index) => {
            return (
              <Person key={index} name={person.name} color={person.color} />
            );
          })}
        </ul>
      </div>
    );
  }
}
```

### Keys

Use of a `key` can improve performance of your dynamic lists of child components by allowing reuse and reordering.

When a `key` is provided, React chooses the most performant method for updating the rendered objects.

#### Example 1

Given the HTML below:

```html
<ul>
  <li>John</li> /* key: "John" */
  <li>Fred</li> /* key: "Fred" */
</ul>
```

In the event that the element containing "Fred" needs to be removed, React will hide the element instead of removing the object entirely like so:

```html
<ul>
  <li>John</li> /* key: "John" */
  <li style={display: 'none'}>Fred</li> /* key: "Fred" */
</ul>
```

#### Example 2

Given the html below:

```html
<ul>
  <li>John</li> /* key: "John" */
  <li>Fred</li> /* key: "Fred" */
</ul>
```

In the event that the element "John" needs to be removed, React will swap the text and hide the second element like so:

```html
<ul>
  <li>Fred</li> /* key: "Fred" */
  <li style={display: 'none'}>Fred</li> /* key: removed */
</ul>
```

As your components begin managing their own `this.state`, including keys becomes increasingly important to the performance of your application.

## Conditional Rendering

With React you can render distinct components depending on the value of your data. This means no longer needing to manually modify the CSS classes of HTML elements. Instead, you would create distinct components that encapsulate behavior you need. Then, render only the specific component you need depending on the state of your application.

This follows the concept of "separation of concerns" by allowing each component to manage how it should be rendered.

### Component Variables

Given the current state of your application you can assign components as the value of variables, then only render the needed component.

In the example below we determine whether to allow the user to log in or log out based on whether or not they are already `loggedIn`. We assign to the variable `loginButton` one of the following components `<LoginButton /> and `<LogoutButton />`.

```javascript
LoginControl extends Component {
  render() {
    var loginButton;
    if (loggedIn) {
      loginButton = <LogoutButton />;
    } else {
      loginButton = <LoginButton />;
    }

    return (
      <div>
        {loginButton}
      </div>
    );
  }
}
```

### Prevent Component Rendering

In some cases, you will not want a component to render. To prevent components from rendering, return `null` or `false` from the `render()` function.

In the example below, a `<WarningBanner />` component will not be rendered within a `<Header /> component.

```javascript
class WarningBanner extends Component {
  render () { return <div className="warning">Warning!</div>; }
}
class Header extends Component {
  render() {
    var displayWarning = false;
    let warningBanner = null;
    if (displayWarning) {
      warningBanner = <WarningBanner />;
    }
    return (
      <div>
        {warningBanner}
      </div>
    );
  }
}
```

> A component `render()` function requires returning only one single component.

### Rendering Multiple Components Using {}

You can build collections of components and render them using the `{}` operator.

In the example below we create a `persons` array. Next, we add multiple `<Person />` components to the array.

Then, in the `render()` function we render the entire `persons` array by invoking `{persons}`.

```javascript
class Person extends Component {
  render() {
    return (
      <li>{this.props.name}</li>
    );
  }
}
class Persons extends Component {
  render() {
    let persons = [];
    persons.push(<Person name="Ben" />)
    persons.push(<Person name="Chris" />)
    persons.push(<Person name="Dan" />)
    persons.push(<Person name="Paul" />)
    persons.push(<Person name="Tom" />)
    return (
      <div>
        <ul>
          {persons}
        </ul>
      </div>
    );
  }
}
```

### Inline If-Else With Ternary Operators

Another method for conditionally rendering inline is to use a ternary operator `(condition) ? true : false`.

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

