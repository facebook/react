# create-component-with-subscriptions

[Async-safe subscriptions are hard to get right.](https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3)

This complexity is acceptible for libraries like Redux/Relay/MobX, but it's not ideal to have mixed in with application code. `create-component-with-subscriptions` provides an interface to easily manage subscriptions in an async-safe way.

## Installation

```sh
# Yarn
yarn add create-component-with-subscriptions

# NPM
npm install create-component-with-subscriptions --save
```

# API

Creating a subscription component requires a configuration object and a React component. The configuration object must have four properties:
* **subscribablePropertiesMap** `{[subscribableProperty: string]: string}` - Maps property names of incoming subscribable sources (e.g. "eventDispatcher") to property names for their values (e.g. "value").
* **getDataFor** `(subscribable: any, propertyName: string) => any` - Synchronously returns the value of the specified subscribable property. If your component has multiple subscriptions,the second 'propertyName' parameter can be used to distinguish between them.
* **subscribeTo** `(
    valueChangedCallback: (value: any) => void,
    subscribable: any,
    propertyName: string,
  ) => any` - Subscribes to the specified subscribable and call the `valueChangedCallback` parameter whenever a subscription changes. If your component has multiple subscriptions, the third 'propertyName' parameter can be used to distinguish between them.
* **unsubscribeFrom** `(
    subscribable: any,
    propertyName: string,
    subscription: any,
  ) => void` - Unsubscribes from the specified subscribable.  If your component has multiple subscriptions, the second `propertyName` parameter can be used to distinguish between them. The value returned by `subscribeTo()` is the third `subscription` parameter.

# Examples

## Subscribing to event dispatchers

Below is an example showing how `create-component-with-subscriptions` can be used to subscribe to event dispatchers such as DOM elements or Flux stores.

```js
import React from "react";
import createComponent from "create-component-with-subscriptions";

// Start with a simple functional (or class-based) component.
function InnerComponent({ followerCount, username }) {
  return (
    <div>
      {username} has {followerCount} follower
    </div>
  );
}

// Wrap the functional component with a subscriber HOC.
// This HOC will manage subscriptions and pass values to the decorated component.
// It will add and remove subscriptions in an async-safe way when props change.
const FollowerCountComponent = createComponent(
  {
    subscribablePropertiesMap: { followerStore: "followerCount" },
    getDataFor: (subscribable, propertyName) => subscribable.value,
    subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
      const onChange = event => valueChangedCallback(subscribable.value);
      subscribable.addEventListener(onChange);
      return onChange;
    },
    unsubscribeFrom: (subscribable, propertyName, subscription) => {
      // `subscription` is the value returned from subscribeTo, our event handler.
      subscribable.removeEventListener(subscription);
    }
  },
  InnerComponent
);

// Your component can now be used as shown below.
// (In this example, `followerStore` represents a generic event dispatcher.)
<FollowerCountComponent followerStore={followerStore} username="Brian" />;
```

## Subscribing to observables

Below is an example showing how `create-component-with-subscriptions` can be used to subscribe to certain types of observables (e.g. RxJS `BehaviorSubject` and `ReplaySubject`).

**Note** that it is not possible to support all observable types (e.g. RxJS `Subject` or `Observable`) because some provide no way to read the "current" value after it has been emitted.

```js
import React from "react";
import createComponent from "create-component-with-subscriptions";

function InnerComponent({ behaviorValue, replayValue }) {
  // Render ...
}

const SubscribedComponent = createComponent(
  {
    subscribablePropertiesMap: {
      behaviorSubject: "behaviorValue",
      replaySubject: "replayValue"
    },
    getDataFor: (subscribable, propertyName) => {
      switch (propertyName) {
        case "behaviorSubject":
          return subscribable.getValue();
        case "replaySubject":
          let currentValue;
          // ReplaySubject does not have a sync data getter,
          // So we need to temporarily subscribe to retrieve the most recent value.
          const temporarySubscription = subscribable.subscribe(value => {
            currentValue = value;
          });
          temporarySubscription.unsubscribe();
          return currentValue;
      }
    },
    subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
      subscribable.subscribe(valueChangedCallback),
    unsubscribeFrom: (subscribable, propertyName, subscription) =>
      subscription.unsubscribe()
  },
  InnerComponent
);

// Your component can now be used as shown below.
// In this example, both properties below represent RxJS types with the same name.
<SubscribedComponent
  behaviorSubject={behaviorSubject}
  replaySubject={replaySubject}
/>;
```