---
id: docs-api
title: React API
layout: docs
prev: advanced-components.html
next: mixins.html
---

## React

`React` is the entry point to the React framework. If you're using one of the prebuilt packages it's available as a global; if you're using CommonJS modules you can `require()` it.

#### React.DOM

`React.DOM` provides all of the standard HTML tags needed to build a React app. You generally don't use it directly; instead, just include it as part of the `/** @jsx React.DOM */` docblock.

#### React.initializeTouchEvents

```javascript
initializeTouchEvents(boolean shouldUseTouch)
```

Configure React's event system to handle touch events on mobile devices.

#### React.autoBind

```javascript
function autoBind(function method)
```

Marks the provided function to be automatically bound to each React component instance created. This allows React components to define automatically bound methods and ensure that when called they will always reference their current instance.

Example:

```javascript
React.createClass({
  click: React.autoBind(function(evt) {
    this.setState({jumping: true});
  }),
  render: function() {
    // Look: no bind!
    return <a onClick={this.click}>Jump</a>;
  }
});
```

#### React.createClass

```javascript
function createClass(object specification)
```

Creates a component given a specification. A component implements a `render` method which returns a single child. That child may have an arbitrarily deep child structure. One thing that makes components different than a standard prototypal classes is that you don't need to call new on them. They are convenience wrappers that construct backing instances (via new) for you.

#### React.renderComponent

```javascript
ReactComponent renderComponent(ReactComponent container, DOMElement mountPoint)
```

Renders a React component into the DOM in the supplied `container`.

If the React component was previously rendered into `container`, this will perform an update on it and only mutate the DOM as necessary to reflect the latest React component.

## AbstractEvent

Your event handlers will be passed instances of `AbstractEvent`, a cross-browser wrapper around the browser's native event. It has the same interface as the browser's native event (such as `stopPropagation()` and `preventDefault()`) except they work exactly the same across all browsers.

If you find that you need the underlying browser event for some reason, simply use the `nativeEvent` attribute to get it.

## ReactComponent

Component classses created by `createClass()` return instances of `ReactComponent` when called. Most of the time when you're using React you're either creating or consuming `ReactComponent`s.

#### getDOMNode

```javascript
DOMElement getDOMNode()
```

If this component has been mounted into the DOM, this returns the corresponding native browser DOM element. This method is useful for reading values out of the DOM, such as form field values and performing DOM measurements.

#### setProps

```javascript
setProps(object nextProps)
```

When you're integrating with an external JavaScript application you may want to signal a change to a React component rendered with `renderComponent()`. Simply call `setProps()` to change its properties and trigger a re-render.

**Note:** This method can only be called on a root-level component. That is, it's only available on the component passed directly to `renderComponent()` and none of its children. If you're inclined to use `setProps()` on a child component, instead take advantage of reactive updates and pass the new prop to the child component when it's created in `render()`.

#### replaceProps

```javascript
replaceProps(object nextProps)
```

Like `setProps()` but deletes any pre-existing props that are not in nextProps.

#### transferPropsTo

```javascript
ReactComponent transferPropsTo(ReactComponent targetComponent)
```

Transfer properties from this component to a target component that have not already been set on the target component. This is usually used to pass down properties to the returned root component. `targetComponent`, now updated with some new props is returned as a convenience.

#### setState

```javascript
setState(object nextState)
```

Merges nextState with the current state. This is the primary method you use to trigger UI updates from event handlers and server request callbacks.

**Note:** *NEVER* mutate `this.state` directly. As calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.

**Note:** `setState()` does not immediately mutate `this.state` but creates a pending state transition. Accessing `this.state` after calling this method can potentially return the existing value.

#### replaceState

```javascript
replaceState(object nextState)
```

Like `setState()` but deletes any pre-existing state keys that are not in nextState.

#### forceUpdate()

```javascript
forceUpdate()
```

If your `render()` method reads from something other than `this.props` or `this.state` you'll need to tell React when it needs to re-run `render()`. Use `forceUpdate()` to cause React to automatically re-render. This will cause `render()` to be called on the component and all of its children but React will only update the DOM if the markup changes.

Normally you should try to avoid all uses of `forceUpdate()` and only read from `this.props` and `this.state` in `render()`. This makes your application much simpler and more efficient.

```javascript
object getInitialState()
componentWillMount()
componentDidMount(DOMElement domNode)
componentWillReceiveProps(object nextProps)
boolean shouldComponentUpdate(object nextProps, object nextState)
componentWillUpdate(object nextProps, object nextState)
ReactComponent render()
componentDidUpdate(object prevProps, object prevState, DOMElement domNode)
componentWillUnmount()
```

See the [advanced components](advanced-components.html) documentation for more details on these lifecycle methods.
