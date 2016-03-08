---
id: context
title: Context
permalink: context.html
prev: advanced-performance.html
---

One of React's biggest strengths is that it's easy to track the flow of data through your React components. When you look at a component, you can easily see exactly which props are being passed in which makes your apps easy to reason about.

Occasionally, you want to pass data through the component tree without having to pass the props down manually at every level. React's "context" feature lets you do this.

> Note:
>
> Context is an advanced and experimental feature. The API is likely to change in future releases.
>
> Most applications will never need to use context. Especially if you are just getting started with React, you likely do not want to use context. Using context will make your code harder to understand because it makes the data flow less clear. It is similar to using global variables to pass state through your application.
>
> **If you have to use context, use it sparingly.**
>
> Regardless of whether you're building an application or a library, try to isolate your use of context to a small area and avoid using the context API directly when possible so that it's easier to upgrade when the API changes.

## Passing info automatically through a tree

Suppose you have a structure like:

```javascript
var Button = React.createClass({
  render: function() {
    return (
      <button style={{'{{'}}background: this.props.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button color={this.props.color}>Delete</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  render: function() {
    var color = "purple";
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} color={color} />;
    });
    return <div>{children}</div>;
  }
});
```

In this example, we manually thread through a `color` prop in order to style the `Button` and `Message` components appropriately. Theming is a good example of when you might want an entire subtree to have access to some piece of information (a color). Using context, we can pass this through the tree automatically:

```javascript{2-4,7,18,25-30,33}
var Button = React.createClass({
  contextTypes: {
    color: React.PropTypes.string
  },
  render: function() {
    return (
      <button style={{'{{'}}background: this.context.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  childContextTypes: {
    color: React.PropTypes.string
  },
  getChildContext: function() {
    return {color: "purple"};
  },
  render: function() {
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} />;
    });
    return <div>{children}</div>;
  }
});
```

By adding `childContextTypes` and `getChildContext` to `MessageList` (the context provider), React passes the information down automatically and any component in the subtree (in this case, `Button`) can access it by defining `contextTypes`.

If `contextTypes` is not defined, then `this.context` will be an empty object.

## Parent-child coupling

Context can also let you build an API such as:

```javascript
<Menu>
  <MenuItem>aubergine</MenuItem>
  <MenuItem>butternut squash</MenuItem>
  <MenuItem>clementine</MenuItem>
</Menu>
```

By passing down the relevant info in the `Menu` component, each `MenuItem` can communicate back to the containing `Menu` component.

**Before you build components with this API, consider if there are cleaner alternatives.** We're fond of simply passing the items as an array in cases like this:

```javascript
<Menu items={['aubergine', 'butternut squash', 'clementine']} />
```

Recall that you can also pass entire React components in props if you'd like to.

## Referencing context in lifecycle methods

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

## Referencing context in stateless functional components

Stateless functional components are also able to reference `context` if `contextTypes` is defined as a property of the function. The following code shows the `Button` component above written as a stateless functional component.

```javascript
function Button(props, context) {
  return (
    <button style={{'{{'}}background: context.color}}>
      {props.children}
    </button>
  );
}
Button.contextTypes = {color: React.PropTypes.string};
```

## Updating context

The `getChildContext` function will be called when the state or props changes. In order to update data in the context, trigger a local state update with `this.setState`. This will trigger a new context and changes will be received by the children.

```javascript
var MediaQuery = React.createClass({
  getInitialState: function(){
    return {type:'desktop'};
  },
  childContextTypes: {
    type: React.PropTypes.string
  },
  getChildContext: function() {
    return {type: this.state.type};
  },
  componentDidMount: function(){
    var checkMediaQuery = function(){
      var type = window.matchMedia("(min-width: 1025px)").matches ? 'desktop' : 'mobile';
      if (type !== this.state.type){
        this.setState({type:type}); 
      }
    };
    
    window.addEventListener('resize', checkMediaQuery);
    checkMediaQuery();
  },
  render: function(){
    return this.props.children;
  }
});
```

## When not to use context

Just as global variables are best avoided when writing clear code, you should avoid using context in most cases. In particular, think twice before using it to "save typing" and using it instead of passing explicit props.

The best use cases for context are for implicitly passing down the logged-in user, the current language, or theme information. All of these might otherwise be true globals, but context lets you scope them to a single React subtree.

Do not use context to pass your model data through components. Threading your data through the tree explicitly is much easier to understand. Using context makes your components more coupled and less reusable, because they behave differently depending on where they're rendered.

## Known limitations

If a context value provided by a component changes, descendants that use that value won't update if an intermediate parent returns `false` from `shouldComponentUpdate`. See issue [#2517](https://github.com/facebook/react/issues/2517) for more details.
