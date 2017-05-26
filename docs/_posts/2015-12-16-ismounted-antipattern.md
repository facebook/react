---
title: "isMounted is an Antipattern"
author: jimfb
---

As we move closer to officially deprecating isMounted, it's worth understanding why the function is an antipattern, and how to write code without the isMounted function.

The primary use case for `isMounted()` is to avoid calling `setState()` after a component has unmounted, because calling `setState()` after a component has unmounted will emit a warning. The “setState warning” exists to help you catch bugs, because calling `setState()` on an unmounted component is an indication that your app/component has somehow failed to clean up properly. Specifically, calling `setState()` in an unmounted component means that your app is still holding a reference to the component after the component has been unmounted - which often indicates a memory leak!

To avoid the error message, people often add lines like this:

```js
if(this.isMounted()) { // This is bad.
  this.setState({...});
}
```

Checking `isMounted` before calling `setState()` does eliminate the warning, but it also defeats the purpose of the warning, since now you will never get the warning (even when you should!)

Other uses of `isMounted()` are similarly erroneous; using `isMounted()` is a code smell because the only reason you would check is because you think you might be holding a reference after the component has unmounted.

An easy migration strategy for anyone upgrading their code to avoid `isMounted()` is to track the mounted status yourself.  Just set a `_isMounted` property to true in `componentDidMount` and set it to false in `componentWillUnmount`, and use this variable to check your component's status.

An optimal solution would be to find places where `setState()` might be called after a component has unmounted, and fix them. Such situations most commonly occur due to callbacks, when a component is waiting for some data and gets unmounted before the data arrives. Ideally, any callbacks should be canceled in `componentWillUnmount`, prior to unmounting.

For instance, if you are using a Flux store in your component, you must unsubscribe in `componentWillUnmount`:

```javascript{9}
class MyComponent extends React.Component {
  componentDidMount() {
    mydatastore.subscribe(this);
  }
  render() {
    ...
  }
  componentWillUnmount() {
    mydatastore.unsubscribe(this);
  }
}
```

If you use ES6 promises, you may need to wrap your promise in order to make it cancelable.

```js
const cancelablePromise = makeCancelable(
  new Promise(r => component.setState({...}}))
);

cancelablePromise
  .promise
  .then(() => console.log('resolved'))
  .catch((reason) => console.log('isCanceled', reason.isCanceled));

cancelablePromise.cancel(); // Cancel the promise
```

Where `makeCancelable` was originally [defined by @istarkov](https://github.com/facebook/react/issues/5465#issuecomment-157888325) as:

```js
const makeCancelable = (promise) => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
      error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};
```
As an added bonus for getting your code cleaned up early, getting rid of `isMounted()` makes it one step easier for you to upgrade to ES6 classes, where using `isMounted()` is already prohibited.  Happy coding!

* _Update 2017-05-12: altered `#makeCancelable` implementation so rejected promises won't go uncaught._
