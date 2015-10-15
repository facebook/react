---
title: "ReactDOM.render and the Top Level React API"
author: ["jimfb", "sebmarkbage"]
---


When you're in React's world you are just building components that fit into other components. Everything is a component. Unfortunately not everything around you is built using React. At the root of your tree you still have to write some plumbing code to connect the outer world into React.

The primary API for rendering into the DOM looks like this:

```js
ReactDOM.render(reactElement, domContainerNode)
```

To update the properties of an existing component, you call render again with a new element.

If you are rendering React components within a single-page app, you may need to plug into the app's view lifecycle to ensure your app will invoke unmountComponentAtNode at the appropriate time. React will not automatically clean up a tree. You need to manually call:

```js
ReactDOM.unmountComponentAtNode(domContainerNode)
```

This is important and often forgotten. Forgetting to call `unmountComponentAtNode` will cause your app to leak memory. There is no way for us to automatically detect when it is appropriate to do this work. Every system is different.

It is not unique to the DOM. If you want to insert a React Native view in the middle of an existing iOS app you will hit similar issues.

## Helpers

If you have multiple React roots, or a single root that gets deleted over time, we recommend that you always create your own wrapper API. These will all look slightly different depending on what your outer system looks like. For example, at Facebook we have a system that automatically ties into our page transition router to automatically call `unmountComponentAtNode`.

Rather than calling `ReactDOM.render()` directly everywhere, consider writing/using a library that will manage mounting and unmounting within your application.

In your environment you may want to always configure internationalization, routers, user data etc. If you have many different React roots it can be a pain to set up configuration nodes all over the place. By creating your own wrapper you can unify that configuration into one place.

## Object Oriented Updates

If you call `ReactDOM.render` a second time to update properties, all your props are completely replaced.

```js
ReactDOM.render(<App locale="en-US" userID={1} />, container);
// props.userID == 1
// props.locale == "en-US"
ReactDOM.render(<App userID={2} />, container);
// props.userID == 2
// props.locale == undefined ??!?
```

In object-oriented programming, all state lives on each object instance and you apply changes incrementally by mutating that state, one piece at a time. If you are using React within an app that expects an object oriented API (for instance, if you are building a custom web component using React), it might be surprising/confusing to a user that setting a single property would wipe out all the other properties on your component.

We used to have a helper function called `setProps` which allowed you to update only a few properties at a time. Unfortunately this API lived on a component instance, required React to keep this state internally and wasn't very natural anyway. Therefore, we're deprecating it and suggest that you build it into your own wrapper instead.

Here's some boilerplate to get you started. It is a 0.14 migration path for codebases using `setProps` and `replaceProps`.

```js
class ReactComponentRenderer {
  constructor(klass, container) {
    this.klass = klass;
    this.container = container;
    this.props = {};
    this.component = null;
  }

  replaceProps(props, callback) {
    this.props = {};
    this.setProps(props, callback);
  }

  setProps(partialProps, callback) {
    if (this.klass == null) {
      console.warn(
        'setProps(...): Can only update a mounted or ' +
        'mounting component. This usually means you called setProps() on ' +
        'an unmounted component. This is a no-op.'
      );
      return;
    }
    Object.assign(this.props, partialProps);
    var element = React.createElement(this.klass, this.props);
    this.component = ReactDOM.render(element, this.container, callback);
  }

  unmount() {
    ReactDOM.unmountComponentAtNode(this.container);
    this.klass = null;
  }
}
```

Object-oriented APIs don't look like that though. They use setters and methods. I think we can do better. If you know more about the component API that you're rendering, you can create a more natural object-oriented API around your React component.

```js
class ReactVideoPlayer {
  constructor(url, container) {
    this._container = container;
    this._url = url;
    this._isPlaying = false;
    this._render();
  }

  _render() {
    ReactDOM.render(
      <VideoPlayer url={this._url} playing={this._isPlaying} />,
      this._container
    );
  }

  get url() {
    return this._url;
  }

  set url(value) {
    this._url = value;
    this._render();
  }

  play() {
    this._isPlaying = true;
    this._render();
  }

  pause() {
    this._isPlaying = false;
    this._render();
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
```

This example shows how to provide an imperative API on top of a declarative one. Similarly, the reverse can be done, and a declarative wrapper can be used when exposing a Web Component as a React component.

