---
id: component-lifecycle-in-depth
title: Component Lifecycle In Depth
permalink: docs/component-lifecycle-in-depth.html
---



### constructor

```js
constructor(props)
```

The constructor for a React component is called before it is mounted. This method is optional, so you can
avoid to write it on your React component. But remember if you use it, you have to call `super()` method at first.
Otherwise you will get an error.

![React Component Lifecycle - Constructor missing super](/react/img/docs/component-lifecycle-in-depth/missing-super.png)

> Note
>
> Be sure to call `super()` before using `this` in the constructor. Otherwise you will get an error.

The `constructor` method is a good place for initializing state or binding methods. If you don't need them,
you don't need to implement a constructor for your React component.

### componentWillMount

```js
componentWillMount()
```

This method is invoked immediately before React inserts a component into the DOM, so it means that
it is invoked right before the `render` method, therefore setting state in this method will not trigger a re-rendering.

There is some important note about this method, based on the [React.Component reference](./react-component.html#componentwillmount):

> Note

> Avoid introducing any side-effects or subscriptions in this method.
> This is the only lifecycle hook called on server rendering.
> Generally, we recommend using the `constructor()` instead.

### render (mounting phase)

```js
render()
```

The `render` method is the required one for all your React components.
It should return a **single React element** (no matter with `React.createElement` or JSX),
which can be either native DOM component (such as `div`, `h1`, `a`),
or another React component you've defined yourself. You can get more information
on [React.Component reference](./react-component.html#render).

You can also return `false` or `null` to render nothing.

### componentDidMount

```js
componentDidMount()
```

The `componentDidMount` method is invoked immediately after React inserts a component into the DOM.
This method is a good place  for integrating the React library with non-React libraries and APIs.
For example using jQuery for your ajax calls, or setting timers with `setTimeout` or `setInterval`.

> Note
>
> Even if you are returning `false` in your `render` method,
> the `componentDidMount` method **will be invoked**.

Now, let's see this basic example:

```js{4,8,12,16}
class App extends React.Component {
  constructor(props) {
    super(props);
    console.log('constructor');
  }

  componentWillMount() {
    console.log('componentWillMount');
  }

  componentDidMount() {
    console.log('componentDidMount');
  }
  
  render() {
    console.log('render');
    return <h1>Mounting</h1>;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
```

![React Component Lifecycle - Mounting Phase](/react/img/docs/component-lifecycle-in-depth/mounting-phase-console.png)

[Try it on CodePen](http://codepen.io/dashtinejad/pen/zoGdgG?editors=0011).

## Updating
This phase occurs when a component is being re-rendered. There are 5 methods in this phase.


```
              UPDATING
-----------------||-----------------
|                ||                |
|   -------------\/-------------   |
|   | componentWillReceiveProps|   |
|   -------------||-------------   |
|                ||                |
|   -------------\/-------------   |
|   |  shouldComponentUpdate   |   |
|   -------------||-------------   |
|                ||                |
|   -------------\/-------------   |
|   |    componentWillUpdate   |   |
|   -------------||-------------   |
|                ||                |
|   -------------\/-------------   |
|   |          render          |   |
|   -------------||-------------   |
|                ||                |
|   -------------\/-------------   |
|   |    componentDidUpdate    |   |
|   -------------||-------------   |
|                ||                |
-----------------\/-----------------
```

### componentWillReceiveProps

```js
componentWillReceiveProps(nextProps)
```

When the component is being re-rendered, this method is invoked.
You have an opportunity to compare the current component's props (using `this.props`)
and the new props (using `nextProps` which is passed to the method), and do some actions,
for example changing the component's state (via `this.setState`) which will not trigger
an additional render in this scenario.

```javascript{15,25-28}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { totalClicks: 0 };
  }

  incrementClick() {
    this.setState({ totalClicks: this.state.totalClicks + 1 });
  }
  
  render() {
    return <div>
      <h1>componentWillReceiveProps</h1>
      <button onClick={this.incrementClick.bind(this)}>Click</button>
      <Message clicks={this.state.totalClicks} />
    </div>;
  }
}

class Message extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps()');
    console.log(this.props, nextProps);
  }

  render() {
    return <div>Your total click is {this.props.clicks}.</div>;
  }
}
```

![React Component Lifecycle - componentWillReceiveProps](/react/img/docs/component-lifecycle-in-depth/componentwillreceiveprops.png)

> Note
>
> The method `componentWillReceiveProps` won't be called at mounting phase.
> Even you are passing props to your component.

So in the above example,
the component get rendered 4 times (one in the mounting phase, and three in the updating phase),
and so, `componentWillReceiveProps` executed three times.

[Try it on CodePen](https://codepen.io/dashtinejad/pen/mOygpw?editors=0011).


### shouldComponentUpdate

```js
shouldComponentUpdate(nextProps, nextState)
```

This method allows us to decide wether the component should be re-render or not.
This method returns a Boolean value, which by default is `true`.
Returning `false` does not prevent child components from re-rendering when **their state changes**.

If this method returns `false`, the following component methods won't be called:

- `componentWillUpdate()`
- `render()`
- `componentDidUpdate()`

To findout the usage of this method, consider this basic example:

```js{15,22,23,27,31}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { totalClicks: 0 };
  }

  incrementClick() {
    this.setState({ totalClicks: this.state.totalClicks + 1 });
  }
  
  render() {
    return <div>
      <h1>Component's Lifecycle</h1>
      <button onClick={this.incrementClick.bind(this)}>Click</button>
      <Message clicks={this.state.totalClicks} />
    </div>;
  }
}

class Message extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    console.log('shouldComponentUpdate()');
    return nextProps.clicks !== 7;
  }

  componentWillUpdate() {
    console.log('componentWillUpdate()');
  }

  componentDidUpdate() {
    console.log('componentDidUpdate()');
  }

  render() {
    console.log('render()');
    return <div>Your total clicks is: <b>{this.props.clicks}</b></div>;
  }
}
```

Clicking the button, will increase total number of clicks.
When it reaches `7`, the `shouldComponentUpdate` method will return false,
and so, the render will not be invoked.

![React Component Lifecycle - shouldComponentUpdate](/react/img/docs/component-lifecycle-in-depth/shouldcomponentupdate-1.png) ![React Component Lifecycle - shouldComponentUpdate](/react/img/docs/component-lifecycle-in-depth/shouldcomponentupdate-2.png)

[Try it on CodePen](http://codepen.io/dashtinejad/pen/MbwEBK?editors=0011).

### componentWillUpdate

```js
componentWillUpdate(nextProps, nextState)
```

This method is invoked in the updating phase, right before the `render` method.
Note that you cannot call `this.setState()` here. If you need to update state in response to a prop change, use `componentWillReceiveProps()` instead.


> Note
>
> `componentWillUpdate` will not be invoked if `shouldComponentUpdate` returns `false`.


### render (updating phase)

```js
render()
```

Now the `render` method is getting invoke. This method is the only method which is invoked
both in the mounting and updating phase. For information about it,
go above and read the [`render` information on mounting phase](#render-mounting-phase).

> Note
>
> `render` will not be invoked if `shouldComponentUpdate` returns `false` (on updating phase).


### componentDidUpdate

```js
componentDidUpdate(prevProps, prevState)
```

The `componentDidUpdate` method is called immediately after React updates the DOM.
After this method is called, the updating cycle ends.
A new cycle is started when a component's state is updated or a parent component passes new properties.


> Note
>
> `componentDidUpdate` will not be invoked if `shouldComponentUpdate` returns `false`.


## Unmounting

This phase occurs when a component is being removed from the DOM. Currently, this phase only has 1 method.

```
             UNMOUNTING
-----------------||-----------------
|                ||                |
|   -------------\/-------------   |
|   |   componentWillUnmount   |   |
|   -------------||-------------   |
|                ||                |
-----------------\/-----------------
```

### componentWillUnmount


