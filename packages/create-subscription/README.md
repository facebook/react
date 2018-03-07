# create-subscription

[Async-safe subscriptions are hard to get right.](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)

`create-subscription` provides an simple, async-safe interface to manage a subscription.

## Who should use this?

This utility is should be used for subscriptions to a single value that are typically only read in one place and may update frequently (e.g. a component that subscribes to the geolocation API to show a dot on a map).

Other cases have better long-term solutions:
* Redux/Flux stores should use the [context API](https://reactjs.org/docs/context.html) instead.
* I/O subscriptions (e.g. notifications) that update infrequently should use [`simple-cache-provider`](https://github.com/facebook/react/blob/master/packages/simple-cache-provider/README.md) instead.
* Complex things like Relay/Apollo should use this same technique (as referenced [here](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)), in a way that is most optimized for their library usage.

## What types of subscriptions can this support?

This abstraction can handle a variety of "subscribable" types. For example:
 * Event dispatchers like `HTMLInputElement` with `addEventListener()`, `removeEventListener()`, and `value` attributes.
 * Custom pub/sub components like Relay's `FragmentSpecResolver` with `subscribe()`, `unsubscribe()`, and `resolve()` methods.
 * Observable types like RxJS `BehaviorSubject` with `subscribe()`, `subscription.unsubscribe()`, and `getValue()` methods.
 * Observable types like RxJS `ReplaySubject`. (**Note** that these types require a temporary subscription inside of `getValue` to retrieve the latest current/value. See tests for an example.)
* Native Promises. (**Note** that it an initial render value of `undefined` is unavoidable due to the fact that Promises provide no way to synchronously read their current value.)

Observable types like RxJS `Subject` or `Observable` are not supported, because they provide no way to read the "current" value after it has been emitted.

# Installation

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
  subscribe(source, callback) {
    // Subscribe (e.g. add an event listener) to the subscription (source).
    // Call callback(newValue) whenever a subscription changes.
    // Return any value that will later be needed to unsubscribe (e.g. an event handler).
  },
  unsubscribe(source, subscription) {
    // Remove your subscription from source.
    // The value returned by subscribe() is the second, 'subscription' parameter.
  }
});
```

To use the `Subscription` component, pass the subscribable property (e.g. an event dispatcher, Flux store, observable) as the `source` property and use a [render prop](https://reactjs.org/docs/render-props.html), `children`, to handle the subscribed value when it changes:

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
  getValue: eventDispatcher => eventDispatcher.value,
  subscribe: (eventDispatcher, callback) => {
    const onChange = event => callback(eventDispatcher.value);
    eventDispatcher.addEventListener("change", onChange);
    return onChange;
  },
  unsubscribe: (eventDispatcher, subscription) => {
    eventDispatcher.removeEventListener("change", subscription);
  }
});

// Your component can now be used as shown below.
// In this example, 'eventDispatcher' represents a generic event dispatcher.
<EventHandlerSubscription source={eventDispatcher}>
  {value => <FollowerComponent followersCount={value} />}
</EventHandlerSubscription>
```

## Subscribing to observables

Below are examples showing how `create-subscription` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

### `BehaviorSubject`
```js
const BehaviorSubscription = createComponent({
  getValue: behaviorSubject => behaviorSubject.getValue(),
  subscribe: (behaviorSubject, callback) =>
    behaviorSubject.subscribe(callback),
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
  subscribe: (replaySubject, callback) =>
    replaySubject.subscribe(callback),
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
function LoadingComponent({ loadingStatus }) {
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
const PromiseSubscription = createComponent({
  getValue: promise => {
    // There is no way to synchronously read a Promise's value,
    // So this method should return undefined.
    return undefined;
  },
  subscribe: (promise, callback) => {
    promise.then(
      // Success
      () => callback(true),
      // Failure
      () => callback(false)
    );
  },
  unsubscribe: (promise, subscription) => {
    // There is no way to "unsubscribe" from a Promise.
    // In this case, create-subscription will block stale values from rendering.
  }
});

// Your component can now be used as shown below.
<PromiseSubscription source={loadingPromise}>
  {loadingStatus => <LoadingComponent loadingStatus={loadingStatus} />}
</PromiseSubscription>
```