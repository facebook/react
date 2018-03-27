# create-subscription

`create-subscription` is a utility for subscribing to external data sources inside React components. It is officially supported and maintained by the React team.

## When should you NOT use this?

This utility should be used for subscriptions to a single value that are typically only read in one place and may update frequently (e.g. a component that subscribes to a geolocation API to show a dot on a map).

Other cases have **better long-term solutions**:
* Redux/Flux stores should use the [context API](https://reactjs.org/docs/context.html) instead.
* I/O subscriptions (e.g. notifications) that update infrequently should use [`simple-cache-provider`](https://github.com/facebook/react/blob/master/packages/simple-cache-provider/README.md) instead.
* Complex libraries like Relay/Apollo should manage subscriptions manually with the same techniques which this library uses under the hood (as referenced [here](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)) in a way that is most optimized for their library usage.

## Limitations in async mode

The main motivation for `create-subscription` is to provide a way for library authors to ensure compatibility with React's upcoming asynchronous rendering mode. `create-subscription` guarantees correctness in async mode, accounting for the subtle bugs and edge cases that a library author might otherwise miss.

However, it achieves correctness by sometimes de-opting to synchronous mode, obviating the benefits of async rendering. This is an inherent limitation of storing state outside of React's managed state queue and rendering in response to a change event.

The effect of de-opting to sync mode is that the main thread may periodically be blocked (in the case of CPU-bound work), and placeholders may appear earlier than desired (in the case of IO-bound work).

For **full compatibility** with asynchronous rendering, including both **time-slicing** and **React Suspense**, the suggested longer term solution is to move to one of the patterns described in the previous section.

## What types of subscriptions can this support?

This abstraction can handle a variety of subscription types, including:
* Event dispatchers like `HTMLInputElement`.
* Custom pub/sub components like Relay's `FragmentSpecResolver`.
* Observable types like RxJS `BehaviorSubject` and `ReplaySubject`. (Types like RxJS `Subject` or `Observable` are not supported, because they provide no way to read the "current" value after it has been emitted.)
* Native Promises.

# Installation

```sh
# Yarn
yarn add create-subscription

# NPM
npm install create-subscription --save
```

# Usage

To configure a subscription, you must provide two methods: `getCurrentValue` and `subscribe`.

```js
import { createSubscription } from "create-subscription";

const Subscription = createSubscription({
  getCurrentValue(source) {
    // Return the current value of the subscription (source),
    // or `undefined` if the value can't be read synchronously (e.g. native Promises).
  },
  subscribe(source, callback) {
    // Subscribe (e.g. add an event listener) to the subscription (source).
    // Call callback(newValue) whenever a subscription changes.
    // Return an unsubscribe method,
    // Or a no-op if unsubscribe is not supported (e.g. native Promises).
  }
});
```

To use the `Subscription` component, pass the subscribable property (e.g. an event dispatcher, observable) as the `source` property and use a [render prop](https://reactjs.org/docs/render-props.html), `children`, to handle the subscribed value when it changes:

```js
<Subscription source={eventDispatcher}>
  {value => <AnotherComponent value={value} />}
</Subscription>
```

# Examples

This API can be used to subscribe to a variety of "subscribable" sources, from event dispatchers to RxJS observables. Below are a few examples of how to subscribe to common types.

## Subscribing to event dispatchers

Below is an example showing how `create-subscription` can be used to subscribe to event dispatchers such as DOM elements.

```js
import React from "react";
import { createSubscription } from "create-subscription";

// Start with a simple component.
// In this case, it's a functional component, but it could have been a class.
function FollowerComponent({ followersCount }) {
  return <div>You have {followersCount} followers!</div>;
}

// Create a wrapper component to manage the subscription.
const EventHandlerSubscription = createSubscription({
  getCurrentValue: eventDispatcher => eventDispatcher.value,
  subscribe: (eventDispatcher, callback) => {
    const onChange = event => callback(eventDispatcher.value);
    eventDispatcher.addEventListener("change", onChange);
    return () => eventDispatcher.removeEventListener("change", onChange);
  }
});

// Your component can now be used as shown below.
// In this example, 'eventDispatcher' represents a generic event dispatcher.
<EventHandlerSubscription source={eventDispatcher}>
  {value => <FollowerComponent followersCount={value} />}
</EventHandlerSubscription>;
```

## Subscribing to observables

Below are examples showing how `create-subscription` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

### `BehaviorSubject`
```js
const BehaviorSubscription = createSubscription({
  getCurrentValue: behaviorSubject => behaviorSubject.getValue(),
  subscribe: (behaviorSubject, callback) => {
    const subscription = behaviorSubject.subscribe(callback);
    return () => subscription.unsubscribe();
  }
});
```

### `ReplaySubject`
```js
const ReplaySubscription = createSubscription({
  getCurrentValue: replaySubject => {
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
  subscribe: (replaySubject, callback) => {
    const subscription = replaySubject.subscribe(callback);
    return () => subscription.unsubscribe();
  }
});
```

## Subscribing to a Promise

Below is an example showing how `create-subscription` can be used with native Promises.

**Note** that it an initial render value of `undefined` is unavoidable due to the fact that Promises provide no way to synchronously read their current value.

**Note** the lack of a way to "unsubscribe" from a Promise can result in memory leaks as long as something has a reference to the Promise. This should be taken into considerationg when determining whether Promises are appropriate to use in this way within your application.

```js
import React from "react";
import { createSubscription } from "create-subscription";

// Start with a simple component.
function LoadingComponent({ loadingStatus }) {
  if (loadingStatus === undefined) {
    // Loading
  } else if (loadingStatus === null) {
    // Error
  } else {
    // Success
  }
}

// Wrap the functional component with a subscriber HOC.
// This HOC will manage subscriptions and pass values to the decorated component.
// It will add and remove subscriptions in an async-safe way when props change.
const PromiseSubscription = createSubscription({
  getCurrentValue: promise => {
    // There is no way to synchronously read a Promise's value,
    // So this method should return undefined.
    return undefined;
  },
  subscribe: (promise, callback) => {
    promise.then(
      // Success
      value => callback(value),
      // Failure
      () => callback(null)
    );

    // There is no way to "unsubscribe" from a Promise.
    // create-subscription will still prevent stale values from rendering.
    return () => {};
  }
});

// Your component can now be used as shown below.
<PromiseSubscription source={loadingPromise}>
  {loadingStatus => <LoadingComponent loadingStatus={loadingStatus} />}
</PromiseSubscription>
```
