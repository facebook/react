---
id: faq-functions
title: Passing Functions to Components
permalink: docs/faq-functions.html
layout: docs
category: FAQ
---

### How do I pass an event handler (like onClick) to a component?

Pass event handlers and other functions as props to child components:

```jsx
<button onClick={this.handleClick}>
```

If you need to have access to the parent component in the handler, you also need to bind the function to the component instance (see below).

### How do I bind a function to a component instance?

There are several ways to make sure functions have access to component attributes like `this.props` and `this.state`, depending on which syntax and build steps you are using.

#### Bind in Constructor (ES2015)

```jsx
class Foo extends Component {
  constructor () {
    this.handleClick = this.handleClick.bind(this)
  }
  handleClick() {
    console.log('Click happened')
  }
  render() {
    return <button onClick={this.handleClick}>Click Me</button>
  }
}
```

#### Class Properties (Stage 3 Proposal)

```jsx
class Foo extends Component {
  handleClick = () => {
    console.log('Click happened')
  }
  render() {
    return <button onClick={this.handleClick}>Click Me</button>
  }
}
```

#### Bind in Render

```jsx
class Foo extends Component {
  handleClick () {
    console.log('Click happened')
  }
  render() {
    return <button onClick={this.handleClick.bind(this)}>Click Me</button>
  }
}
```

#### Arrow Function in Render

```jsx
class Foo extends Component {
  handleClick () {
    console.log('Click happened')
  }
  render() {
    return <button onClick={() => this.handleClick()}>Click Me</button>
  }
}
```

**Note**: Using an arrow function or binding in render creates a new function each time the component renders, which may have performance implications (see below).

### Is it OK to use arrow functions in render methods?

Generally speaking, yes, it is OK, and it is often the easiest way to pass parameters to callback functions.

If you do have performance issues, by all means, optimize!

### Why is my function being called every time the component re-renders?

Make sure you aren't _calling the function_ when you pass it to the component:

```jsx
render() {
  {*/ handleClick is called instead of passed as a reference! */}
  return <button onClick={this.handleClick()}>Click Me</button> 
}
```

### How do I pass a parameter to an event handler or callback?

You can use an arrow function to wrap around an event handler and pass parameters: 

```jsx
class Foo extends Component {
  handleClick (name) {
    console.log('Clicked ' + name)
  }
  render() {
    const name = 'My Button'
    return <button onClick={() => this.handleClick(name)}>Click Me</button> 
  }
}
```
