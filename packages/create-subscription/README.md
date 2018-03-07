# create-subscription

[Async-safe subscriptions are hard to get right.](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)

This complexity is acceptible for libraries like Redux/Relay/MobX, but it's not ideal to have mixed in with application code. `create-subscription` provides an interface to easily manage subscriptions in an async-safe way.

## Installation

```sh
# Yarn
yarn add create-subscription

# NPM
npm install create-subscription --save
```

# API

Creating a subscription component requires a configuration object and a React component. The configuration object must have four properties:

#### `property: string`

Property name of the subscribable sources (e.g. "hasLoaded").

#### `getValue: (props: Props) => Value`

Synchronously returns the value of the subscribable property.

You should return `undefined` if the subscribable type does not support this operation (e.g. native Promises).

For example:
```js
function getValue(props: Props) {
  return props.scrollContainer.scrollTop;
}
```

#### `subscribe(props: Props, valueChangedCallback: (value: any) => void) => Subscription`

Setup a subscription for the subscribable value in `props`. This subscription should call the `valueChangedCallback` parameter whenever a subscription changes.

For example:
```js
function subscribe(props: Props, valueChangedCallback: (value: any) => void) {
  const {scrollContainer} = props;
  const onScroll = event => valueChangedCallback(scrollContainer.scrollTop);
  scrollContainer.addEventListener("scroll", onScroll);
  return onScroll;
}
```

#### `unsubscribe: (props: Props, subscription: Subscription) => void`

Unsubsribe from the subscribable value in `props`. The value returned by `subscribe()` is the second, `subscription` parameter.

For example:
```js
function unsubscribe(props, subscription) {
  props.scrollContainer.removeEventListener("scroll", subscription);
}
```

# How it works

Depending on the type of React component specified, `create-subscription` will either create a wrapper component or use a mixin technique.

If a stateless functional component is specified, a high-order component will be wrapped around it. The wrapper will pass through all `props`. The subscribed value will be passed in place of the "subscribable" prop though.

Given the above example, a stateless functional component would look something like this:
```js
function ExampleComponent({ scrollTop, ...rest }) {
  // Render ...
}
```

If a class (or `create-react-class`) component is specified, the library uses an ["ES6 mixin"](https://gist.github.com/sebmarkbage/fac0830dbb13ccbff596) technique in order to preserve compatibility with refs and to avoid the overhead of an additional fiber. In this case, the subscription value will be stored in `state` (using the same `property` name) and be accessed from within the `render` method.

Given the above example, a class component would look something like this:
```js
class ExampleComponent extends React.Component {
  render() {
    const { scrollTop } = this.state;
    // Render ...
  }
}
```

Examples of both [functional](#subscribing-to-event-dispatchers) and [class](#subscribing-to-a-promise) components are provided below.

# Examples

This API can be used to subscribe to a variety of "subscribable" sources, from Flux stores to RxJS observables. Below are a few examples of how to subscribe to common types.

## Subscribing to event dispatchers

Below is an example showing how `create-subscription` can be used to subscribe to event dispatchers such as DOM elements or Flux stores.

```js
import React from "react";
import createComponent from "create-subscription";

// Start with a simple component.
// In this case, it's a functional component, but it could have been a class.
function InnerComponent({ followers, username }) {
  return (
    <div>
      {username} has {followers} follower
    </div>
  );
}

// Wrap the functional component with a subscriber HOC.
// This HOC will manage subscriptions and pass values to the decorated component.
// It will add and remove subscriptions in an async-safe way when props change.
const FollowerCountComponent = createComponent(
  {
    property: "followers",
    getValue: props => props.followers.value,
    subscribe: (props, valueChangedCallback) => {
      const { followers } = props;
      const onChange = event => valueChangedCallback(followers.value);
      followers.addEventListener("change", onChange);
      return onChange;
    },
    unsubscribe: (props, subscription) => {
      // `subscription` is the value returned from subscribe, our event handler.
      props.followers.removeEventListener("change", subscription);
    }
  },
  InnerComponent
);

// Your component can now be used as shown below.
// In this example, `followerStore` represents a generic event dispatcher.
<FollowerCountComponent followers={followersStore} username="Brian" />;
```

## Subscribing to observables

Below are examples showing how `create-subscription` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

### `BehaviorSubject`
```js
const SubscribedComponent = createComponent(
  {
    property: "behaviorSubject",
    getValue: props => props.behaviorSubject.getValue(),
    subscribe: (props, valueChangedCallback) =>
      props.behaviorSubject.subscribe(valueChangedCallback),
    unsubscribe: (props, subscription) => subscription.unsubscribe()
  },
  ({ behaviorSubject }) => {
    // Render ...
  }
);
```

### `ReplaySubject`
```js
const SubscribedComponent = createComponent(
  {
    property: "replaySubject",
    getValue: props => {
      let currentValue;
      // ReplaySubject does not have a sync data getter,
      // So we need to temporarily subscribe to retrieve the most recent value.
      const temporarySubscription = props.replaySubject.subscribe(value => {
        currentValue = value;
      });
      temporarySubscription.unsubscribe();
      return currentValue;
    },
    subscribe: (props, valueChangedCallback) =>
      props.replaySubject.subscribe(valueChangedCallback),
    unsubscribe: (props, subscription) => subscription.unsubscribe()
  },
  ({ replaySubject }) => {
    // Render ...
  }
);
```

## Subscribing to a Promise

Below is an example showing how `create-subscription` can be used with native Promises.

**Note** that it an initial render value of `undefined` is unavoidable due to the fact that Promises provide no way to synchronously read their current value.

**Note** the lack of a way to "unsubscribe" from a Promise can result in memory leaks as long as something has a reference to the Promise. This should be taken into considerationg when determining whether Promises are appropriate to use in this way within your application.

```js
import React from "react";
import createComponent from "create-subscription";

// Start with a simple component.
function InnerComponent({ loadingStatus }) {
  if (loadingStatus === undefined) {
    // Loading
  } else if (loadingStatus) {
    // Success
  } else {
    // Error
  }
}

// Wrap the functional component with a subscriber HOC.
// This HOC will manage subscriptions and pass values to the decorated component.
// It will add and remove subscriptions in an async-safe way when props change.
const LoadingComponent = createComponent(
  {
    property: "loadingStatus",
    getValue: (props, subscription) => {
      // There is no way to synchronously read a Promise's value,
      // So this method should return undefined.
      return undefined;
    },
    subscribe: (props, valueChangedCallback) => {
      props.loadingStatus.then(
        // Success
        () => valueChangedCallback(true),
        // Failure
        () => valueChangedCallback(false)
      );
    },
    unsubscribe: (props, subscription) => {
      // There is no way to "unsubscribe" from a Promise.
      // In this case, create-subscription will block stale values from rendering.
    }
  },
  InnerComponent
);

// Your component can now be used as shown below.
<LoadingComponent loadingStatus={loadingPromise} />;
```

## Optional parameters and default values

Subscribable properties are treated as optional by `create-subscription`. In the event that a subscribable `prop` is missing, a value of `undefined` will be passed to the decorated component (using `props` for a functional component or `state` for a class component).

If you would like to set default values for missing subscriptions, you can do this as shown below.

For functional components, declare a default value while destructuring the `props` parameter:
```js
function InnerComponent({ followers = 0 }) {
  return <div>You have {followers} followers.</div>;
}
```

For class components, declare a default value while destructuring `state`:
```js
class InnerComponent extends React.Component {
  state = {};
  render() {
    const { followers = 0 } = this.state;
    return <div>You have {followers} followers.</div>;
  }
}
```

## Subscribing to multiple sources

It is possible for a single component to subscribe to multiple data sources. To do this, compose the return value of `create-subscription` as shown below:

```js
function InnerComponent({ bar, foo }) {
  // Render ...
}

const MultiSubscriptionComponent = createComponent(
  {
    property: "promiseTwo",
    getValue: props => props.promiseTwo.getValue(),
    subscribe: (props, valueChangedCallback) =>
      props.promiseTwo.subscribe(valueChangedCallback),
    unsubscribe: (props, subscription) => subscription.unsubscribe()
  },
  createComponent(
    {
      property: "promiseTwo",
      getValue: props => props.promiseTwo.getValue(),
      subscribe: (props, valueChangedCallback) =>
        props.promiseTwo.subscribe(valueChangedCallback),
      unsubscribe: (props, subscription) => subscription.unsubscribe()
    },
    InnerComponent
  )
);

// Your component can now be used as shown below.
<MultiSubscriptionComponent promiseOne={promiseOne} promiseTwo={promiseTwo} />;
```