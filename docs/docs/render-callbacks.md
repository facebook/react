---
id: render-callbakcs
title: Render Callbacks
permalink: docs/render-callbacks.html
---

Render callbacks are an advanced technique for certain types of asynchronous rendering. A render callback is a function that is passed as a prop to a React element, and is called at some point in the future. The render callback is typically passed additional data that isn't available at the time the element is rendered:

```js
render() {
  return (
    <FetchData
      url="/path/to/data"
      renderOnSuccess={(data) => <ChildComponent data={data} />}
    />
  );
}
```

In this example, the `FetchData` component fetches some data from an endpoint. While the data is loading, it renders nothing. Once the data is ready, the render callback `renderOnSuccess` is used to compute the rendered content. `FetchData` could also be implemented to accept an additional render callback that specifies the content to render while loading, and another that handles an error.

Render callbacks work by giving a child component control over how and when to render part of the UI.

## Passing a render callback as the children prop

A popular convention is to pass a render callback to the `children` prop:

```js
<FetchData url="/path/to/data">
  {(data) => <ChildComponent data={data} />}
</FetchData>
```

The `FetchData` component's `children` prop can be called as a function: `this.props.children(data)`.

This has aesthetic advantages, but it's the same as passing a callback to any other named prop.

## Comparison to higher-order components

Render callbacks can sometimes be used as an alternative to [higher-order components](/react/docs/higher-order-components.html). For example, the higher-order component equivalent of the `FetchData` example above looks like this:

```js
// ChildComponent will receive a `data` prop
const EnhancedChildComponent = fetchData('/path/to/data')(ChildComponent);

// Inside the parent's render method:
render() {
  return (
    <EnhancedChildComponent />
  );
}
```

Whether a render callback or a higher-order component is a better solution ultimately comes down to a matter of preference.

If you're unsure whether to use a higher-order component or a render callback, default to using a higher-order component. They cover more cases and are typically more straightforward to implement.
