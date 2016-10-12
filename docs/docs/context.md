---
id: context
title: Context
permalink: docs/context.html
---

With React, it's easy to track the flow of data through your React components. When you look at a component, you can see which props are being passed, which makes your apps easy to reason about.

In some cases, you want to pass data through the component tree without having to pass the props down manually at every level. There are several popular libraries that help you do this, like [Redux](https://github.com/reactjs/redux) and [MobX](https://github.com/mobxjs/mobx).
You can also do this directly in React with the powerful "context" API.

> Note:
>
> Context is an advanced and experimental feature. If you are not an experienced React developer, you do not want to use context. If you are getting annoyed by passing props down manually through many levels of a tree, first try using [Redux](https://github.com/reactjs/redux) or [MobX](https://github.com/mobxjs/mobx).
>
> **If you have to use context, use it sparingly.**
>
> Regardless of whether you're building an application or a library, try to isolate your use of context to a small area and avoid using the context API directly when possible so that it's easier to upgrade when the API changes.

## Passing Data Through A Tree

Suppose you have a structure like:

```javascript
class Button extends React.Component {
  render() {
    return (
      <button style={{'{{'}}background: this.props.color}}>
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

```javascript{4,11-13,19,26-28,38-40}
class Button extends React.Component {
  render() {
    return (
      <button style={{'{{'}}background: this.context.color}}>
        {this.props.children}
      </button>
    );
  }
}

Button.contextTypes = {
  color: React.PropTypes.string
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
  color: React.PropTypes.string
};
```

By adding `childContextTypes` and `getChildContext` to `MessageList` (the context provider), React passes the information down automatically and any component in the subtree (in this case, `Button`) can access it by defining `contextTypes`.

If `contextTypes` is not defined, then `context` will be an empty object.

## Parent-Child Coupling

Context can also let you build an API where parents and children communicate. For example, one library that works this way is [React Router V4](https://react-router.now.sh/basic):

```javascript
const BasicExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/topics">Topics</Link></li>
      </ul>

      <hr/>

      <Match exactly pattern="/" component={Home} />
      <Match pattern="/about" component={About} />
      <Match pattern="/topics" component={Topics} />
    </div>
  </Router>
)
```

By passing down some information from the `Router` component, each `Link` and `Match` can communicate back to the containing `Router`.

Before you build components with an API similar to this, consider if there are cleaner alternatives. For example, you can pass entire React component as props if you'd like to.

## Referencing Context in Lifecycle Methods

If `contextTypes` is defined within a component, the following lifecycle methods will receive an additional parameter, the `context` object:

```javascript
void componentWillReceiveProps(
  object nextProps, object nextContext
)

boolean shouldComponentUpdate(
  object nextProps, object nextState, object nextContext
)

void componentWillUpdate(
  object nextProps, object nextState, object nextContext
)

void componentDidUpdate(
  object prevProps, object prevState, object prevContext
)
```

## Referencing Context in Stateless Functional Components

Stateless functional components are also able to reference `context` if `contextTypes` is defined as a property of the function. The following code shows a `Button` component written as a stateless functional component.

```javascript
const Button = ({children}, context) =>
  <button style={{'{{'}}background: context.color}}>
    {children}
  </button>;

Button.contextTypes = {color: React.PropTypes.string};
```

## Updating Context

The `getChildContext` function will be called when the state or props changes. In order to update data in the context, trigger a local state update with `this.setState`. This will trigger a new context and changes will be received by the children.

```javascript
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
  type: React.PropTypes.string
};
```

## Known Limitations

If a context value provided by a component changes, descendants that use that value won't update if an intermediate parent returns `false` from `shouldComponentUpdate`. See issue [#2517](https://github.com/facebook/react/issues/2517) for more details.
