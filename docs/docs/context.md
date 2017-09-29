---
id: context
title: Context
permalink: docs/context.html
---

> Note:
>
> `React.PropTypes` has moved into a different package since React v15.5. Please use [the `prop-types` library instead](https://www.npmjs.com/package/prop-types) to define `contextTypes`.
>
>We provide [a codemod script](/blog/2017/04/07/react-v15.5.0.html#migrating-from-react.proptypes) to automate the conversion.

With React, it's easy to track the flow of data through your React components. When you look at a component, you can see which props are being passed, which makes your apps easy to reason about.

In some cases, you want to pass data through the component tree without having to pass the props down manually at every level.
You can do this directly in React with the powerful "context" API.


## Why Not To Use Context

The vast majority of applications do not need to use context.

If you want your application to be stable, don't use context. It is an experimental API and it is likely to break in future releases of React.

If you aren't familiar with state management libraries like [Redux](https://github.com/reactjs/redux) or [MobX](https://github.com/mobxjs/mobx), don't use context. For many practical applications, these libraries and their React bindings are a good choice for managing state that is relevant to many components. It is far more likely that Redux is the right solution to your problem than that context is the right solution.

If you aren't an experienced React developer, don't use context. There is usually a better way to implement functionality just using props and state.

If you insist on using context despite these warnings, try to isolate your use of context to a small area and avoid using the context API directly when possible so that it's easier to upgrade when the API changes.

## How To Use Context

Suppose you have a structure like:

```javascript
class Button extends React.Component {
  render() {
    return (
      <button style={{background: this.props.color}}>
        {this.props.children}
      </button>
    );
  }
}

class Message extends React.Component {
  render() {
    return (
      <div>
        {this.props.text} <Button color={this.props.color}>Delete</Button>
      </div>
    );
  }
}

class MessageList extends React.Component {
  render() {
    const color = "purple";
    const children = this.props.messages.map((message) =>
      <Message text={message.text} color={color} />
    );
    return <div>{children}</div>;
  }
}
```

In this example, we manually thread through a `color` prop in order to style the `Button` and `Message` components appropriately. Using context, we can pass this through the tree automatically:

```javascript{6,13-15,21,28-30,40-42}
import PropTypes from 'prop-types';

class Button extends React.Component {
  render() {
    return (
      <button style={{background: this.context.color}}>
        {this.props.children}
      </button>
    );
  }
}

Button.contextTypes = {
  color: PropTypes.string
};

class Message extends React.Component {
  render() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
}

class MessageList extends React.Component {
  getChildContext() {
    return {color: "purple"};
  }

  render() {
    const children = this.props.messages.map((message) =>
      <Message text={message.text} />
    );
    return <div>{children}</div>;
  }
}

MessageList.childContextTypes = {
  color: PropTypes.string
};
```

By adding `childContextTypes` and `getChildContext` to `MessageList` (the context provider), React passes the information down automatically and any component in the subtree (in this case, `Button`) can access it by defining `contextTypes`.

If `contextTypes` is not defined, then `context` will be an empty object.

## Parent-Child Coupling

Context can also let you build an API where parents and children communicate. For example, one library that works this way is [React Router V4](https://reacttraining.com/react-router):

```javascript
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

const BasicExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/topics">Topics</Link></li>
      </ul>

      <hr />

      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/topics" component={Topics} />
    </div>
  </Router>
);
```

By passing down some information from the `Router` component, each `Link` and `Route` can communicate back to the containing `Router`.

Before you build components with an API similar to this, consider if there are cleaner alternatives. For example, you can pass entire React component as props if you'd like to.

## Referencing Context in Lifecycle Methods

If `contextTypes` is defined within a component, the following [lifecycle methods](/docs/react-component.html#the-component-lifecycle) will receive an additional parameter, the `context` object:

- [`constructor(props, context)`](/docs/react-component.html#constructor)
- [`componentWillReceiveProps(nextProps, nextContext)`](/docs/react-component.html#componentwillreceiveprops)
- [`shouldComponentUpdate(nextProps, nextState, nextContext)`](/docs/react-component.html#shouldcomponentupdate)
- [`componentWillUpdate(nextProps, nextState, nextContext)`](/docs/react-component.html#componentwillupdate)

> Note:
>
> As of React 16, `componentDidUpdate` no longer receives `prevContext`.

## Referencing Context in Stateless Functional Components

Stateless functional components are also able to reference `context` if `contextTypes` is defined as a property of the function. The following code shows a `Button` component written as a stateless functional component.

```javascript
import PropTypes from 'prop-types';

const Button = ({children}, context) =>
  <button style={{background: context.color}}>
    {children}
  </button>;

Button.contextTypes = {color: PropTypes.string};
```

## Updating Context

Don't do it.

React has an API to update context, but it is fundamentally broken and you should not use it.

The `getChildContext` function will be called when the state or props changes. In order to update data in the context, trigger a local state update with `this.setState`. This will trigger a new context and changes will be received by the children.

```javascript
import PropTypes from 'prop-types';

class MediaQuery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {type:'desktop'};
  }

  getChildContext() {
    return {type: this.state.type};
  }

  componentDidMount() {
    const checkMediaQuery = () => {
      const type = window.matchMedia("(min-width: 1025px)").matches ? 'desktop' : 'mobile';
      if (type !== this.state.type) {
        this.setState({type});
      }
    };

    window.addEventListener('resize', checkMediaQuery);
    checkMediaQuery();
  }

  render() {
    return this.props.children;
  }
}

MediaQuery.childContextTypes = {
  type: PropTypes.string
};
```

The problem is, if a context value provided by component changes, descendants that use that value won't update if an intermediate parent returns `false` from `shouldComponentUpdate`. This is totally out of control of the components using context, so there's basically no way to reliably update the context. [This blog post](https://medium.com/@mweststrate/how-to-safely-use-react-context-b7e343eff076) has a good explanation of why this is a problem and how you might get around it.
