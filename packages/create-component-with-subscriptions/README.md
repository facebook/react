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

#### `subscribablePropertiesMap: {[subscribableProperty: string]: string}`

Maps property names of incoming subscribable sources (e.g. "eventDispatcher") to property names for their values (e.g. "value").

For example:
```js
{
  followerStore: 'followerCount',
  scrollContainer: 'scrollTop',
}
```

#### `getDataFor(subscribable: any, propertyName: string) => any`

Synchronously returns the value of the specified subscribable property. If your component has multiple subscriptions, the second `propertyName` parameter can be used to distinguish between them.

For example:
```js
function getDataFor(subscribable, propertyName) {
  switch (propertyName) {
    case "followerStore":
      return subscribable.getValue();
    case "scrollContainer":
      return subscriber.scrollTop;
  }
}
```

#### `subscribeTo(valueChangedCallback: (value: any) => void, subscribable: any, propertyName: string) => any`

Subscribes to the specified subscribable and call the `valueChangedCallback` parameter whenever a subscription changes. If your component has multiple subscriptions, the third 'propertyName' parameter can be used to distinguish between them.

For example:
```js
function subscribeTo(valueChangedCallback, subscribable, propertyName) {
  switch (propertyName) {
    case "followerStore":
      return subscribable.subscribe(valueChangedCallback);
    case "scrollContainer":
      const onScroll = event => valueChangedCallback(subscribable.scrollTop);
      subscribable.addEventListener("scroll", onScroll);
      return onChange;
  }
}
```

#### `unsubscribeFrom(subscribable: any, propertyName: string, subscription: any) => void`

Unsubscribes from the specified subscribable.  If your component has multiple subscriptions, the second `propertyName` parameter can be used to distinguish between them. The value returned by `subscribeTo()` is the third `subscription` parameter.

For example:
```js
function unsubscribeFrom(subscribable, propertyName, subscription) {
  switch (propertyName) {
    case "followerStore":
      return subscription.unsubscribe();
    case "scrollContainer":
      subscribable.removeEventListener("change", subscription);
  }
}
```

# How it works

Depending on the type of React component specified, `create-component-with-subscriptions` will either create a wrapper component or use a mixin technique.

If a stateless functional component is specified, a high-order component will be wrapped around it. The wrapper will pass through all `props` (including "subscribables"). In addition, it will also pass the values of each subscribable as `props` (using the name specified by `subscribablePropertiesMap`).

Given the above example, a stateless functional component would look something like this:
```js
function ExampleComponent({ followerCount, scrollTop, ...rest }) {
  // Render ...
}
```

If a class (or `create-react-class`) component is specified, the library uses an ["ES6 mixin"](https://gist.github.com/sebmarkbage/fac0830dbb13ccbff596) technique in order to preserve compatibility with refs and to avoid the overhead of an additional fiber. Subscription values will be stored in `state` (using the name specified by `subscribablePropertiesMap`) to be accessed from within the `render` method.

Given the above example, a class component would look something like this:
```js
class ExampleComponent extends React.Component {
  render() {
    const { followerCount, scrollTop, ...rest } = this.props;
    // Render ...
  }
}
```

Examples of both [functional](#subscribing-to-event-dispatchers) and [class](#subscribing-to-a-promise) components are provided below.

# Examples

This API can be used to subscribe to a variety of "subscribable" sources, from Flux stores to RxJS observables. Below are a few examples of how to subscribe to common types.

## Subscribing to event dispatchers

Below is an example showing how `create-component-with-subscriptions` can be used to subscribe to event dispatchers such as DOM elements or Flux stores.

```js
import React from "react";
import createComponent from "create-component-with-subscriptions";

// Start with a simple component.
// In this case, it's a functional component, but it could have been a class.
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
      subscribable.addEventListener("change", onChange);
      return onChange;
    },
    unsubscribeFrom: (subscribable, propertyName, subscription) => {
      // `subscription` is the value returned from subscribeTo, our event handler.
      subscribable.removeEventListener("change", subscription);
    }
  },
  InnerComponent
);

// Your component can now be used as shown below.
// In this example, `followerStore` represents a generic event dispatcher.
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

## Subscribing to a Promise

Below is an example showing how `create-component-with-subscriptions` can be used with native Promises.

**Note** that it an initial render value of `undefined` is unavoidable due to the fact that Promises provide no way to synchronously read their current value.

**Note** the lack of a way to "unsubscribe" from a Promise can result in memory leaks as long as something has a reference to the Promise. This should be taken into considerationg when determining whether Promises are appropriate to use in this way within your application.

```js
import React from "react";
import createComponent from "create-component-with-subscriptions";

// Start with a simple component.
// In this case, it's a class component, but it could have been functional.
class InnerComponent extends React.Component {
  // Subscribed values will be stored in state.
  state = {};
  render() {
    const { loadingStatus } = this.state;
    if (loadingStatus === undefined) {
      // Loading
    } else if (loadingStatus) {
      // Success
    } else {
      // Error
    }
  }
}

// Add subscription logic mixin to the class component.
// The mixin will manage subscriptions and store the values in state.
// It will add and remove subscriptions in an async-safe way when props change.
const LoadingComponent = createComponent(
  {
    subscribablePropertiesMap: { loadingPromise: "loadingStatus" },
    getDataFor: (subscribable, propertyName, subscription) => {
      // There is no way to synchronously read a Promise's value,
      // So this method should return undefined.
      return undefined;
    },
    subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
      let subscribed = true;
      subscribable.then(
        // Success
        () => {
          if (subscribed) {
            valueChangedCallback(true);
          }
        },
        // Failure
        () => {
          if (subscribed) {
            valueChangedCallback(false);
          }
        }
      );
      return {
        unsubscribe() {
          subscribed = false;
        }
      };
    },
    unsubscribeFrom: (subscribable, propertyName, subscription) =>
      subscription.unsubscribe()
  },
  InnerComponent
);

// Your component can now be used as shown below.
<LoadingComponent loadingPromise={loadingPromise} />;
```

## Optional parameters and default values

Subscribable properties are treated as optional by `create-component-with-subscriptions`. In the event that a subscribable `prop` is missing, a value of `undefined` will be passed to the decorated component (using `props` for a functional component or `state` for a class component).

If you would like to set default values for missing subscribables, you can do this as shown below.

For functional components, declare a default value while destructuring the `props` parameter:
```js
function InnerComponent({ followerCount = 0 }) {
  return <div>You have {followerCount} followers.</div>;
}
```

For class components, declare a default value while destructuring `state`:
```js
class InnerComponent extends React.Component {
  state = {};
  render() {
    const { followerCount = 0 } = this.state;
    return <div>You have {followerCount} followers.</div>;
  }
}
```