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

# Usage

To configure a subscription, you must specify three properties: `getValue`, `subscribe`, and `unsubscribe`.

```js
import createComponent from "create-subscription";

const Subscription = createComponent({
  getValue(source) {
    // Return the current value of the subscription (source),
    // or `undefined` if the value can't be read synchronously (e.g. native Promises).
  },
  subscribe(source, valueChangedCallback) {
    // Subscribe (e.g. add an event listener) to the subscription (source).
    // Call valueChangedCallback() whenever a subscription changes.
    // Return any value that will later be needed to unsubscribe (e.g. an event handler).
  },
  unsubscribe(source, subscription) {
    // Remove your subscription from source.
    // The value returned by subscribe() is the second, 'subscription' parameter.
  }
});
```

To use the `Subscription` component, pass the subscribable property (e.g. an event dispatcher, Flux store, observable) as the `source` property and use a [`children` render prop](https://reactjs.org/docs/render-props.html) to handle the subscribed value when it changes:

```js
<Subscription source={eventDispatcher}>
  {value => <AnotherComponent value={value} />}
</Subscription>
```

# Examples

This API can be used to subscribe to a variety of "subscribable" sources, from Flux stores to RxJS observables. Below are a few examples of how to subscribe to common types.

## Subscribing to event dispatchers

Below is an example showing how `create-subscription` can be used to subscribe to event dispatchers such as DOM elements or Flux stores.

```js
import React from "react";
import createComponent from "create-subscription";

// Start with a simple component.
// In this case, it's a functional component, but it could have been a class.
function FollowerComponent({ followersCount }) {
  return <div>You have {followersCount} followers!</div>;
}

// Create a wrapper component to manage the subscription.
const EventHandlerSubscription = createComponent({
  getValue: followers => followers.value,
  subscribe: (followers, valueChangedCallback) => {
    const onChange = event => valueChangedCallback(followers.value);
    followers.addEventListener("change", onChange);
    return onChange;
  },
  unsubscribe: (followers, subscription) => {
    followers.removeEventListener("change", subscription);
  }
});

// Your component can now be used as shown below.
// In this example, `followerStore` represents a generic event dispatcher.
<EventHandlerSubscription source={followersStore}>
  {followersCount => <FollowerComponent followersCount={followersCount} />}
</EventHandlerSubscription>
```

## Subscribing to observables

Below are examples showing how `create-subscription` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

### `BehaviorSubject`
```js
const BehaviorSubscription = createComponent({
  getValue: behaviorSubject => behaviorSubject.getValue(),
  subscribe: (behaviorSubject, valueChangedCallback) =>
    behaviorSubject.subscribe(valueChangedCallback),
  unsubscribe: (behaviorSubject, subscription) => behaviorSubject.unsubscribe()
});
```

### `ReplaySubject`
```js
const ReplaySubscription = createComponent({
  getValue: replaySubject => {
    let currentValue;
    // ReplaySubject does not have a sync data getter,
    // So we need to temporarily subscribe to retrieve the most recent value.
    replaySubject
      .subscribe(value => {
        currentValue = value;
      })
      .unsubscribe();
    return currentValue;
  },
  subscribe: (replaySubject, valueChangedCallback) =>
    replaySubject.subscribe(valueChangedCallback),
  unsubscribe: (replaySubject, subscription) => replaySubject.unsubscribe()
});
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
const PromiseSubscription = createComponent(
  {
    getValue: promise => {
      // There is no way to synchronously read a Promise's value,
      // So this method should return undefined.
      return undefined;
    },
    subscribe: (promise, valueChangedCallback) => {
      promise.then(
        // Success
        () => valueChangedCallback(true),
        // Failure
        () => valueChangedCallback(false)
      );
    },
    unsubscribe: (promise, subscription) => {
      // There is no way to "unsubscribe" from a Promise.
      // In this case, create-subscription will block stale values from rendering.
    }
  },
  InnerComponent
);

// Your component can now be used as shown below.
<PromiseSubscription source={loadingPromise}>
  {loadingStatus => <InnerComponent loadingStatus={loadingStatus} />}
</PromiseSubscription>;
```