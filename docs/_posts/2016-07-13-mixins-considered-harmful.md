---
title: "Mixins Considered Harmful"
author: [gaearon]
---

“How do I share the code between several components?” is one of the first questions that people ask when they learn React. Our answer has always been to use component composition for code reuse. You can define a component and use it in several other components.

It is not always obvious how a certain pattern can be solved with composition. React is influenced by functional programming but it came into the field that was dominated by object-oriented libraries. It was hard for engineers both inside and outside of Facebook to give up on the patterns they were used to.

To ease the initial adoption and learning, we included certain escape hatches into React. The mixin system was one of those escape hatches, and its goal was to give you a way to reuse code between components when you aren’t sure how to solve the same problem with composition.

Three years passed since React was released. The landscape has changed. Multiple view libraries now adopt a component model similar to React. Using composition over inheritance to build declarative user interfaces is no longer a novelty. We are also more confident in the React component model, and we have seen many creative uses of it both internally and in the community.

In this post, we will consider the problems commonly caused by mixins. Then we will suggest several alternative patterns for the same use cases. We have found those patterns to scale better with the complexity of the codebase than mixins.

## Why Mixins are Broken

At Facebook, React usage has grown from a few components to thousands of them. This gives us a window into how people use React. Thanks to declarative rendering and top-down data flow, many teams were able to fix a bunch of bugs while shipping new features as they adopted React.

However it’s inevitable that some of our code using React gradually became incomprehensible. Occasionally, the React team would see groups of components in different projects that people were afraid to touch. These components were too easy to break accidentally, were confusing to new developers, and eventually became just as confusing to the people who wrote them in the first place. Much of this confusion was caused by mixins. At the time, I wasn’t working at Facebook but I came to the [same conclusions](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750) after writing my fair share of terrible mixins.

This doesn’t mean that mixins themselves are bad. People successfully employ them in different languages and paradigms, including some functional languages. At Facebook, we extensively use traits in Hack which are fairly similar to mixins. Nevertheless, we think that mixins are unnecessary and problematic in React codebases. Here’s why.

### Mixins introduce implicit dependencies

Sometimes a component relies on a certain method defined in the mixin, such as `getClassName()`. Sometimes it’s the other way around, and mixin calls a method like `renderHeader()` on the component. JavaScript is a dynamic language so it’s hard to enforce or document these dependencies.

Mixins break the common and usually safe assumption that you can rename a state key or a method by searching for its occurrences in the component file. You might write a stateful component and then your coworker might add a mixin that reads this state. In a few months, you might want to move that state up to the parent component so it can be shared with a sibling. Will you remember to update the mixin to read a prop instead? What if, by now, other components also use this mixin?

These implicit dependencies make it hard for new team members to contribute to a codebase. A component’s `render()` method might reference some method that isn’t defined on the class. Is it safe to remove? Perhaps it’s defined in one of the mixins. But which one of them? You need to scroll up to the mixin list, open each of those files, and look for this method. Worse, mixins can specify their own mixins, so the search can be deep.

Often, mixins come to depend on other mixins, and removing one of them breaks the other. In these situations it is very tricky to tell how the data flows in and out of mixins, and what their dependency graph looks like. Unlike components, mixins don’t form a hierarchy: they are flattened and operate in the same namespace.

### Mixins cause name clashes

There is no guarantee that two particular mixins can be used together. For example, if `FluxListenerMixin` defines `handleChange()` and `WindowSizeMixin` defines `handleChange()`, you can’t use them together. You also can’t define a method with this name on your own component.

It’s not a big deal if you control the mixin code. When you have a conflict, you can rename that method on one of the mixins. However it’s tricky because some components or other mixins may already be calling this method directly, and you need to find and fix those calls as well.

If you have a name conflict with a mixin from a third party package, you can’t just rename a method on it. Instead, you have to use awkward method names on your component to avoid clashes.

The situation is no better for mixin authors. Even adding a new method to a mixin is always a potentially breaking change because a method with the same name might already exist on some of the components using it, either directly or through another mixin. Once written, mixins are hard to remove or change. Bad ideas don’t get refactored away because refactoring is too risky.

### Mixins cause snowballing complexity

Even when mixins start out simple, they tend to become complex over time. The example below is based on a real scenario I’ve seen play out in a codebase.

A component needs some state to track mouse hover. To keep this logic reusable, you might extract `handleMouseEnter()`, `handleMouseLeave()` and `isHovering()` into a `HoverMixin`. Next, somebody needs to implement a tooltip. They don’t want to duplicate the logic in `HoverMixin` so they create a `TooltipMixin` that uses `HoverMixin`. `TooltipMixin` reads `isHovering()` provided by `HoverMixin` in its `componentDidUpdate()` and either shows or hides the tooltip.

A few months later, somebody wants to make the tooltip direction configurable. In an effort to avoid code duplication, they add support for a new optional method called `getTooltipOptions()` to `TooltipMixin`. By this time, components that show popovers also use `HoverMixin`. However popovers need a different hover delay. To solve this, somebody adds support for an optional `getHoverOptions()` method and implements it in `TooltipMixin`. Those mixins are now tightly coupled.

This is fine while there are no new requirements. However this solution doesn’t scale well. What if you want to support displaying multiple tooltips in a single component? You can’t define the same mixin twice in a component. What if the tooltips need to be displayed automatically in a guided tour instead of on hover? Good luck decoupling `TooltipMixin` from `HoverMixin`. What if you need to support the case where the hover area and the tooltip anchor are located in different components? You can’t easily hoist the state used by mixin up into the parent component. Unlike components, mixins don’t lend themselves naturally to such changes.

Every new requirement makes the mixins harder to understand. Components using the same mixin become increasingly coupled with time. Any new capability gets added to all of the components using that mixin. There is no way to split a “simpler” part of the mixin without either duplicating the code or introducing more dependencies and indirection between mixins. Gradually, the encapsulation boundaries erode, and since it’s hard to change or remove the existing mixins, they keep getting more abstract until nobody understands how they work.

These are the same problems we faced building apps before React. We found that they are solved by declarative rendering, top-down data flow, and encapsulated components. At Facebook, we have been migrating our code to use alternative patterns to mixins, and we are generally happy with the results. You can read about those patterns below.

## Migrating from Mixins

Let’s make it clear that mixins are not technically deprecated. If you use `React.createClass()`, you may keep using them. We only say that they didn’t work well for us, and so we won’t recommend using them in the future.

Every section below corresponds to a mixin usage pattern that we found in the Facebook codebase. For each of them, we describe the problem and a solution that we think works better than mixins. The examples are written in ES5 but once you don’t need mixins, you can switch to ES6 classes if you’d like.

We hope that you find this list helpful. Please let us know if we missed important use cases so we can either amend the list or be proven wrong!

### Performance Optimizations

One of the most commonly used mixins is [`PureRenderMixin`](/docs/pure-render-mixin.html). You might be using it in some components to [prevent unnecessary re-renders](/docs/advanced-performance.html#shouldcomponentupdate-in-action) when the props and state are shallowly equal to the previous props and state:

```javascript
var PureRenderMixin = require('react-addons-pure-render-mixin');

var Button = React.createClass({
  mixins: [PureRenderMixin],

  // ...

});
```

#### Solution

To express the same without mixins, you can use the [`shallowCompare`](/docs/shallow-compare.html) function directly instead:

```js
var shallowCompare = require('react-addons-shallow-compare');

var Button = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  },

  // ...

});
```

If you use a custom mixin implementing a `shouldComponentUpdate` function with different algorithm, we suggest exporting just that single function from a module and calling it directly from your components.

We understand that more typing can be annoying. For the most common case, we plan to [introduce a new base class](https://github.com/facebook/react/pull/7195) called `React.PureComponent` in the next minor release. It uses the same shallow comparison as `PureRenderMixin` does today.

### Subscriptions and Side Effects

The second most common type of mixins that we encountered are mixins that subscribe a React component to a third-party data source. Whether this data source is a Flux Store, an Rx Observable, or something else, the pattern is very similar: the subscription is created in `componentDidMount`, destroyed in `componentWillUnmount`, and the change handler calls `this.setState()`.

```javascript
var SubscriptionMixin = {
  getInitialState: function() {
    return {
      comments: DataSource.getComments()
    };
  },

  componentDidMount: function() {
    DataSource.addChangeListener(this.handleChange);
  },

  componentWillUnmount: function() {
    DataSource.removeChangeListener(this.handleChange);
  },

  handleChange: function() {
    this.setState({
      comments: DataSource.getComments()
    });
  }
};

var CommentList = React.createClass({
  mixins: [SubscriptionMixin],

  render: function() {
    // Reading comments from state managed by mixin.
    var comments = this.state.comments;
    return (
      <div>
        {comments.map(function(comment) {
          return <Comment comment={comment} key={comment.id} />
        })}
      </div>
    )
  }
});

module.exports = CommentList;
```

#### Solution

If there is just one component subscribed to this data source, it is fine to embed the subscription logic right into the component. Avoid premature abstractions.

If several components used this mixin to subscribe to a data source, a nice way to avoid repetition is to use a pattern called [“higher-order components”](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750). It can sound intimidating so we will take a closer look at how this pattern naturally emerges from the component model.

#### Higher-Order Components Explained

Let’s forget about React for a second. Consider these two functions that add and multiply numbers, logging the results as they do that:

```js
function addAndLog(x, y) {
  var result = x + y;
  console.log('result:', result);
  return result;
}

function multiplyAndLog(x, y) {
  var result = x * y;
  console.log('result:', result);
  return result;
}
```

These two functions are not very useful but they help us demonstrate a pattern that we can later apply to components.

Let’s say that we want to extract the logging logic out of these functions without changing their signatures. How can we do this? An elegant solution is to write a [higher-order function](https://en.wikipedia.org/wiki/Higher-order_function), that is, a function that takes a function as an argument and returns a function.

Again, it sounds more intimidating than it really is:

```js
function withLogging(wrappedFunction) {
  // Return a function with the same API...
  return function(x, y) {
    // ... that calls the original function
    var result = wrappedFunction(x, y);
    // ... but also logs its result!
    console.log('result:', result);
    return result;
  };
}
```

The `withLogging` higher-order function lets us write `add` and `multiply` without the logging statements, and later wrap them to get `addAndLog` and `multiplyAndLog` with exactly the same signatures as before:

```js
function add(x, y) {
  return x + y;
}

function multiply(x, y) {
  return x * y;
}

function withLogging(wrappedFunction) {
  return function(x, y) {
    var result = wrappedFunction(x, y);
    console.log('result:', result);
    return result;
  };
}

// Equivalent to writing addAndLog by hand:
var addAndLog = withLogging(add);

// Equivalent to writing multiplyAndLog by hand:
var multiplyAndLog = withLogging(multiply);
```

Higher-order components are a very similar pattern, but applied to components in React. We will apply this transformation from mixins in two steps.

As a first step, we will split our `CommentList` component in two, a child and a parent. The child will be only concerned with rendering the comments. The parent will set up the subscription and pass the up-to-date data to the child via props.

```js
// This is a child component.
// It only renders the comments it receives as props.
var CommentList = React.createClass({
  render: function() {
    // Note: now reading from props rather than state.
    var comments = this.props.comments;
    return (
      <div>
        {comments.map(function(comment) {
          return <Comment comment={comment} key={comment.id} />
        })}
      </div>
    )
  }
});

// This is a parent component.
// It subscribes to the data source and renders <CommentList />.
var CommentListWithSubscription = React.createClass({
  getInitialState: function() {
    return {
      comments: DataSource.getComments()
    };
  },

  componentDidMount: function() {
    DataSource.addChangeListener(this.handleChange);
  },

  componentWillUnmount: function() {
    DataSource.removeChangeListener(this.handleChange);
  },

  handleChange: function() {
    this.setState({
      comments: DataSource.getComments()
    });
  },

  render: function() {
    // We pass the current state as props to CommentList.
    return <CommentList comments={this.state.comments} />;
  }
});

module.exports = CommentListWithSubscription;
```

There is just one final step left to do.

Remember how we made `withLogging()` take a function and return another function wrapping it? We can apply a similar pattern to React components.

We will write a new function called `withSubscription(WrappedComponent)`. Its argument could be any React component. We will pass `CommentList` as `WrappedComponent`, but we could also apply `withSubscription()` to any other component in our codebase.

This function would return another component. The returned component would manage the subscription and render `<WrappedComponent />` with the current data.

We call this pattern a “higher-order component”.

The composition happens at React rendering level rather than with a direct function call. This is why it doesn’t matter whether the wrapped component is defined with `createClass()`, as an ES6 class or a function. If `WrappedComponent` is a React component, the component created by `withSubscription()` can render it.

```js
// This function takes a component...
function withSubscription(WrappedComponent) {
  // ...and returns another component...
  return React.createClass({
    getInitialState: function() {
      return {
        comments: DataSource.getComments()
      };
    },

    componentDidMount: function() {
      // ... that takes care of the subscription...
      DataSource.addChangeListener(this.handleChange);
    },

    componentWillUnmount: function() {
      DataSource.removeChangeListener(this.handleChange);
    },

    handleChange: function() {
      this.setState({
        comments: DataSource.getComments()
      });
    },

    render: function() {
      // ... and renders the wrapped component with the fresh data!
      return <WrappedComponent comments={this.state.comments} />;
    }
  });
}
```

Now we can declare `CommentListWithSubscription` by applying `withSubscription` to `CommentList`:

```js
var CommentList = React.createClass({
  render: function() {
    var comments = this.props.comments;
    return (
      <div>
        {comments.map(function(comment) {
          return <Comment comment={comment} key={comment.id} />
        })}
      </div>
    )
  }
});

// withSubscription() returns a new component that
// is subscribed to the data source and renders
// <CommentList /> with up-to-date data.
var CommentListWithSubscription = withSubscription(CommentList);

// The rest of the app is interested in the subscribed component
// so we export it instead of the original unwrapped CommentList.
module.exports = CommentListWithSubscription;
```

#### Solution, Revisited

Now that we understand higher-order components better, let’s take another look at the complete solution that doesn’t involve mixins. There are a few minor changes that are annotated with inline comments:

```js
function withSubscription(WrappedComponent) {
  return React.createClass({
    getInitialState: function() {
      return {
        comments: DataSource.getComments()
      };
    },

    componentDidMount: function() {
      DataSource.addChangeListener(this.handleChange);
    },

    componentWillUnmount: function() {
      DataSource.removeChangeListener(this.handleChange);
    },

    handleChange: function() {
      this.setState({
        comments: DataSource.getComments()
      });
    },

    render: function() {
      // Use JSX spread syntax to pass all props and state down automatically.
      return <WrappedComponent {...this.props} {...this.state} />;
    }
  });
}

// Optional change: convert CommentList to a functional component
// because it doesn't use lifecycle hooks or state.
function CommentList(props) {
  var comments = props.comments;
  return (
    <div>
      {comments.map(function(comment) {
        return <Comment comment={comment} key={comment.id} />
      })}
    </div>
  )
}

// Instead of declaring CommentListWithSubscription,
// we export the wrapped component right away.
module.exports = withSubscription(CommentList);
```

Higher-order components are a powerful pattern. You can pass additional arguments to them if you want to further customize their behavior. After all, they are not even a feature of React. They are just functions that receive components and return components that wrap them.

Like any solution, higher-order components have their own pitfalls. For example, if you heavily use [refs](/docs/more-about-refs.html), you might notice that wrapping something into a higher-order component changes the ref to point to the wrapping component. In practice we discourage using refs for component communication so we don’t think it’s a big issue. In the future, we might consider adding [ref forwarding](https://github.com/facebook/react/issues/4213) to React to solve this annoyance.

### Rendering Logic

The next most common use case for mixins that we discovered in our codebase is sharing rendering logic between components.

Here is a typical example of this pattern:

```js
var RowMixin = {
  // Called by components from render()
  renderHeader: function() {
    return (
      <div className='row-header'>
        <h1>
          {this.getHeaderText() /* Defined by components */}
        </h1>
      </div>
    );
  }
};

var UserRow = React.createClass({
  mixins: [RowMixin],

  // Called by RowMixin.renderHeader()
  getHeaderText: function() {
    return this.props.user.fullName;
  },

  render: function() {
    return (
      <div>
        {this.renderHeader() /* Defined by RowMixin */}
        <h2>{this.props.user.biography}</h2>
      </div>
    )
  }
});
```

Multiple components may be sharing `RowMixin` to render the header, and each of them would need to define `getHeaderText()`.

#### Solution

If you see rendering logic inside a mixin, it’s time to extract a component!

Instead of `RowMixin`, we will define a `<RowHeader>` component. We will also replace the convention of defining a `getHeaderText()` method with the standard mechanism of top-data flow in React: passing props.

Finally, since neither of those components currently need lifecycle hooks or state, we can declare them as simple functions:

```js
function RowHeader(props) {
  return (
    <div className='row-header'>
      <h1>{props.text}</h1>
    </div>
  );
}

function UserRow(props) {
  return (
    <div>
      <RowHeader text={props.user.fullName} />
      <h2>{props.user.biography}</h2>
    </div>
  );
}
```

Props keep component dependencies explicit, easy to replace, and enforceable with tools like [Flow](https://flowtype.org/) and [TypeScript](https://www.typescriptlang.org/).

> **Note:**
>
> Defining components as functions is not required. There is also nothing wrong with using lifecycle hooks and state—they are first-class React features. We use functional components in this example because they are easier to read and we didn’t need those extra features, but classes would work just as fine.

### Context

Another group of mixins we discovered were helpers for providing and consuming [React context](/docs/context.html). Context is an experimental unstable feature, has [certain issues](https://github.com/facebook/react/issues/2517), and will likely change its API in the future. We don’t recommend using it unless you’re confident there is no other way of solving your problem.

Nevertheless, if you already use context today, you might have been hiding its usage with mixins like this:

```js
var RouterMixin = {
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },

  // The mixin provides a method so that components
  // don't have to use the context API directly.
  push: function(path) {
    this.context.router.push(path)
  }
};

var Link = React.createClass({
  mixins: [RouterMixin],

  handleClick: function(e) {
    e.stopPropagation();

    // This method is defined in RouterMixin.
    this.push(this.props.to);
  },

  render: function() {
    return (
      <a onClick={this.handleClick}>
        {this.props.children}
      </a>
    );
  }
});

module.exports = Link;
```

#### Solution

We agree that hiding context usage from consuming components is a good idea until the context API stabilizes. However, we recommend using higher-order components instead of mixins for this.

Let the wrapping component grab something from the context, and pass it down with props to the wrapped component:

```js
function withRouter(WrappedComponent) {
  return React.createClass({
    contextTypes: {
      router: React.PropTypes.object.isRequired
    },

    render: function() {
      // The wrapper component reads something from the context
      // and passes it down as a prop to the wrapped component.
      var router = this.context.router;
      return <WrappedComponent {...this.props} router={router} />;
    }
  });
};

var Link = React.createClass({
  handleClick: function(e) {
    e.stopPropagation();

    // The wrapped component uses props instead of context.
    this.props.router.push(this.props.to);
  },

  render: function() {
    return (
      <a onClick={this.handleClick}>
        {this.props.children}
      </a>
    );
  }
});

// Don't forget to wrap the component!
module.exports = withRouter(Link);
```

If you’re using a third party library that only provides a mixin, we encourage you to file an issue with them linking to this post so that they can provide a higher-order component instead. In the meantime, you can create a higher-order component around it yourself in exactly the same way.

### Utility Methods

Sometimes, mixins are used solely to share utility functions between components:

```js
var ColorMixin = {
  getLuminance(color) {
    var c = parseInt(color, 16);
    var r = (c & 0xFF0000) >> 16;
    var g = (c & 0x00FF00) >> 8;
    var b = (c & 0x0000FF);
    return (0.299 * r + 0.587 * g + 0.114 * b);
  }
};

var Button = React.createClass({
  mixins: [ColorMixin],

  render: function() {
    var theme = this.getLuminance(this.props.color) > 160 ? 'dark' : 'light';
    return (
      <div className={theme}>
        {this.props.children}
      </div>
    )
  }
});
```

#### Solution

Put utility functions into regular JavaScript modules and import them. This also makes it easier to test them or use them outside of your components:

```js
var getLuminance = require('../utils/getLuminance');

var Button = React.createClass({
  render: function() {
    var theme = getLuminance(this.props.color) > 160 ? 'dark' : 'light';
    return (
      <div className={theme}>
        {this.props.children}
      </div>
    )
  }
});
```

### Other Use Cases

Sometimes people use mixins to selectively add logging to lifecycle hooks in some components. In the future, we intend to provide an [official DevTools API](https://github.com/facebook/react/issues/5306) that would let you implement something similar without touching the components. However it’s still very much a work in progress. If you heavily depend on logging mixins for debugging, you might want to keep using those mixins for a little longer.

If you can’t accomplish something with a component, a higher-order component, or a utility module, it could be mean that React should provide this out of the box. [File an issue](https://github.com/facebook/react/issues/new) to tell us about your use case for mixins, and we’ll help you consider alternatives or perhaps implement your feature request.

Mixins are not deprecated in the traditional sense. You can keep using them with `React.createClass()`, as we won’t be changing it further. Eventually, as ES6 classes gain more adoption and their usability problems in React are solved, we might split `React.createClass()` into a separate package because most people wouldn’t need it. Even in that case, your old mixins would keep working.

We believe that the alternatives above are better for the vast majority of cases, and we invite you to try writing React apps without using mixins.
