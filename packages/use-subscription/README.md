# use-subscription

React hook that safely manages subscriptions in concurrent mode.

This utility can be used for subscriptions to a single value that are typically only read in one place and may update frequently (e.g. a component that subscribes to a geolocation API to show a dot on a map).

## When should you NOT use this?

Most other cases have **better long-term solutions**:
* Redux/Flux stores should use the [context API](https://reactjs.org/docs/context.html) instead.
* I/O subscriptions (e.g. notifications) that update infrequently should use a mechanism like [`react-cache`](https://github.com/facebook/react/blob/main/packages/react-cache/README.md) instead.
* Complex libraries like Relay/Apollo should manage subscriptions manually with the same techniques which this library uses under the hood (as referenced [here](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)) in a way that is most optimized for their library usage.

## Limitations in concurrent mode

`use-subscription` is safe to use in concurrent mode. However, [it achieves correctness by sometimes de-opting to synchronous mode](https://github.com/facebook/react/issues/13186#issuecomment-403959161), obviating the benefits of concurrent rendering. This is an inherent limitation of storing state outside of React's managed state queue and rendering in response to a change event.

The effect of de-opting to sync mode is that the main thread may periodically be blocked (in the case of CPU-bound work), and placeholders may appear earlier than desired (in the case of IO-bound work).

For **full compatibility** with concurrent rendering, including both **time-slicing** and **React Suspense**, the suggested longer-term solution is to move to one of the patterns described in the previous section.

## What types of subscriptions can this support?

This abstraction can handle a variety of subscription types, including:
* Event dispatchers like `HTMLInputElement`.
* Custom pub/sub components like Relay's `FragmentSpecResolver`.
* Observable types like RxJS `BehaviorSubject` and `ReplaySubject`. (Types like RxJS `Subject` or `Observable` are not supported, because they provide no way to read the "current" value after it has been emitted.)

Note that JavaScript promises are also **not supported** because they provide no way to synchronously read the "current" value.

# Installation

```sh
# Yarn
yarn add use-subscription

# NPM
npm install use-subscription
```

# Usage

To configure a subscription, you must provide two methods: `getCurrentValue` and `subscribe`.

In order to avoid removing and re-adding subscriptions each time this hook is called, the parameters passed to this hook should be memoized. This can be done by wrapping the entire subscription with `useMemo()`, or by wrapping the individual callbacks with `useCallback()`.

## Subscribing to event dispatchers

Below is an example showing how `use-subscription` can be used to subscribe to event dispatchers such as DOM elements.

```js
import React, { useMemo } from "react";
import { useSubscription } from "use-subscription";

// In this example, "input" is an event dispatcher (e.g. an HTMLInputElement)
// but it could be anything that emits an event and has a readable current value.
function Example({ input }) {

  // Memoize to avoid removing and re-adding subscriptions each time this hook is called.
  const subscription = useMemo(
    () => ({
      getCurrentValue: () => input.value,
      subscribe: callback => {
        input.addEventListener("change", callback);
        return () => input.removeEventListener("change", callback);
      }
    }),

    // Re-subscribe any time our input changes
    // (e.g. we get a new HTMLInputElement prop to subscribe to)
    [input]
  );

  // The value returned by this hook reflects the input's current value.
  // Our component will automatically be re-rendered when that value changes.
  const value = useSubscription(subscription);

  // Your rendered output goes here ...
}
```

## Subscribing to observables

Below are examples showing how `use-subscription` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

### `BehaviorSubject`
```js
const subscription = useMemo(
  () => ({
    getCurrentValue: () => behaviorSubject.getValue(),
    subscribe: callback => {
      const subscription = behaviorSubject.subscribe(callback);
      return () => subscription.unsubscribe();
    }
  }),

  // Re-subscribe any time the behaviorSubject changes
  [behaviorSubject]
);

const value = useSubscription(subscription);
```

### `ReplaySubject`
```js
const subscription = useMemo(
  () => ({
    getCurrentValue: () => {
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
    subscribe: callback => {
      const subscription = replaySubject.subscribe(callback);
      return () => subscription.unsubscribe();
    }
  }),

  // Re-subscribe any time the replaySubject changes
  [replaySubject]
);

const value = useSubscription(subscription);
```
