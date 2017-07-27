---
title: "Error Handling in React 16"
author: gaearon
---

As React 16 release is getting closer, we would like to announce a few changes to how React handles JavaScript errors inside components. These changes are included in React 16 beta versions, and will be a part of React 16.

**By the way, [we just released the first beta of React 16 for you to try!](https://github.com/facebook/react/issues/10294)**

## Behavior in React 15 and Earlier

In the past, JavaScript errors inside components used to corrupt React’s internal state and cause it to [emit](https://github.com/facebook/react/issues/4026) [cryptic](https://github.com/facebook/react/issues/6895) [errors](https://github.com/facebook/react/issues/8579) on next renders. These errors were always caused by an earlier error in the application code, but React did not provide a way to handle them gracefully in components, and could not recover from them.

## Introducing Error Boundaries

A JavaScript error in a part of the UI shouldn’t break the whole app. To solve this problem for React users, React 16 introduces a new concept of an “error boundary”.

Error boundaries are React components that **catch JavaScript errors in their descendants, log those errors, and display a fallback UI** instead of the component tree that crashed. Error boundaries catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them.

A class component becomes an error boundary if it defines a new lifecycle method called `componentDidCatch(error, info)`:

```js{7-12,15-18}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    logErrorToMyService(error, info);
  }
  
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

Then you can use it as a regular component:

```js
<ErrorBoundary>
  <MyWidget />
</ErrorBoundary>
```

The `componentDidCatch()` method works like a JavaScript `catch {}` block, but for components. Only class components can be error boundaries. In practice, most of the time you’ll want to declare an error boundary component once and use it throughout your application.

Note that **error boundaries only catch errors in the components below them in the tree**. An error boundary can’t catch an error within itself. If an error boundary fails trying to render the error message, the error will propagate to the closest error boundary above it. This, too, is similar to how `catch {}` block works in JavaScript.

## Live Demo

Check out [this example of declaring and using an error boundary](https://codepen.io/gaearon/pen/wqvxGa?editors=0010) with [React 16 beta](https://github.com/facebook/react/issues/10294).

## Where to Place Error Boundaries

The granularity of error boundaries is up to you. You may wrap top-level route components to display a “Something went wrong” message to the user, just like server-side frameworks often handle crashes. You may also wrap individual widgets in an error boundary to protect them from crashing the rest of the application.

## New Behavior for Uncaught Errors

This change has an important implication. **As of React 16, errors that were not caught by any error boundary will result in unmounting of the whole React component tree.**

We debated this decision, but in our experience it is worse to leave corrupted UI in place than to completely remove it. For example, in a product like Messenger leaving the broken UI visible could lead to somebody sending a message to the wrong person. Similarly, it is worse for a payments app to display a wrong amount than to render nothing.

This change means that as you migrate to React 16, you will likely uncover existing crashes in your application that have been unnoticed before. Adding error boundaries lets you provide better user experience when something goes wrong.

For example, Facebook Messenger wraps content of the sidebar, the info panel, the conversation log, and the message input into separate error boundaries. If some component in one of these UI areas crashes, the rest of them remain interactive.

We also encourage you to use JS error reporting services (or build your own) so that you can learn about unhandled exceptions as they happen in production, and fix them.

## Why Not Use `try` / `catch`?

`try` / `catch` is great but it only works for imperative code:

```js
try {
  showButton();
} catch (error) {
  // ...
}
```

However, React components are declarative and specify *what* should be rendered:

```js
<Button />
```

Error boundaries preserve the declarative nature of React, and behave as you would expect. For example, even if an error occurs in a `componentDidUpdate` hook caused by a `setState` somewhere deep in the tree, it will still correctly propagate to the closest error boundary.

## Naming Changes from React 15

React 15 included a very limited support for error boundaries under a different method name: `unstable_handleError`. This method no longer works, and you will need to change it to `componentDidCatch` in your code starting from the first 16 beta release.
