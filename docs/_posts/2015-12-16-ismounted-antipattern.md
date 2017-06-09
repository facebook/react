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

If you use ES6 promises, you will need to wrap your promise and use the wrapped promise in order to control whether or not the `then` callback gets executed.

```js
const managedPromise = managePromise(
  /* In actual practice, this is where we would pass our Promise-returning async call: 
     The code below simply simulates such call */
  new Promise((resolve, reject) => {
    // callback invoked upon success of some async call
    const successCallback = (val) => {
      console.log('async call was successful')
      resolve(val)
    }
    // simulating async call
    setTimeout(successCallback, 1000, 'success')

    // In actual practice, we'd also have a failureCallback that reject()'s the promise with
    // some error value
  })
);

managedPromise
  .promise
  .then((val) => {
    // call to component.setState goes here, so it can be prevented by cancelThen()
    console.log('resolved with', val)
  })
  .catch((reason) => console.log('cancelThen', reason.cancelThen));

managedPromise.cancelThen(); // Cancel the 'then' on managed promise
```

Where `managePromise` was originally [defined by @istarkov](https://github.com/facebook/react/issues/5465#issuecomment-157888325) and [modified by @idibidiart](https://github.com/facebook/react/issues/9801) as:

```js
const managePromise = (originalPromise) => {
  let cancelThen = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    originalPromise.then(
      val => cancelThen ? reject({cancelThen: true}) : resolve(val),
      error => cancelThen ? reject({cancelThen: true}) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancelThen() {
      cancelThen = true;
    },
  };
};
```
As an added bonus for getting your code cleaned up early, getting rid of `isMounted()` makes it one step easier for you to upgrade to ES6 classes, where using `isMounted()` is not supported.  Happy coding!

* _Update 2017-05-12: altered `#makeCancelable` implementation so rejected promises won't go uncaught._
* _Update 2017-05-30: eliminated confusion with respect to ES Promise spec by changing `#makeCancelable` to `#managePromise` since 'Cancellable' means something else in ES spec Promise discussions. Also, changed `#cancel()` to `#cancelThen()` and moved `component.setState` to the `then` stage so that it can be prevented from being invoked after component has been unmounted.


