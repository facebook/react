---
id: webcomponents
title: Web Components
permalink: webcomponents.html
prev: reconciliation.html
next: glossary.html
---

Trying to compare and contrast React with WebComponents inevitably results in specious conclusions, because the two libraries are built to solve different problems.  WebComponents provide strong encapsulation for reusable components, while React provides a declarative library that keeps the DOM in sync with your data.  The two goals are complementary; engineers can mix-and-match the technologies.  As a developer, you are free to use React in your WebComponents, or to use WebComponents in React, or both.

## Using Web Components in React

```javascript
class HelloMessage extends React.Component{
  render() {
    return <div>Hello <x-search>{this.props.name}</x-search>!</div>;
  }
}
```

> Note:
>
> The programming models of the two component systems (web components vs. react components) differ in that
> web components often expose an imperative API (for instance, a `video` web component might expose `play()`
> and `pause()` functions).  To the extent that web components are declarative functions of their attributes,
> they should work, but to access the imperative APIs of a web component, you will need to attach a ref to the
> component and interact with the DOM node directly.  If you are using third-party web components, the
> recommended solution is to write a React component that behaves as a wrapper for your web component.
> 
> At this time, events emitted by a web component may not properly propagate through a React render tree.
> You will need to manually attach event handlers to handle these events within your React components.


## Using React in your Web Components


```javascript
var proto = Object.create(HTMLElement.prototype, {
  createdCallback: {
    value: function() {
      var mountPoint = document.createElement('span');
      this.createShadowRoot().appendChild(mountPoint);

      var name = this.getAttribute('name');
      var url = 'https://www.google.com/search?q=' + encodeURIComponent(name);
      ReactDOM.render(<a href={url}>{name}</a>, mountPoint);
    }
  }
});
document.registerElement('x-search', {prototype: proto});
```

## Complete Example

Check out the `webcomponents` example in the [starter kit](/react/downloads.html) for a complete example.

