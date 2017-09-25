---
id: portals
title: Portals
permalink: docs/portals.html
---

Portals provide a first-class way to render children into a DOM node that exists outside the DOM hierarchy of the parent component.

```js
ReactDOM.createPortal(child, container)
```

The first argument (`child`) is any [renderable React child](/docs/react-component.html#render), such as an element, string, or fragment. The second argument (`container`) is a DOM element.

## Usage

Normally, when you return an element from a component's render method, it's mounted into the DOM as a child of the nearest parent node:

```js{4,6}
render() {
  // React mounts a new div and renders the children into it
  return (
    <div>
      {this.props.children}
    </div>
  );
}
```

However, sometimes it's useful to insert a child into a different location in the DOM:

```js{6}
render() {
  // React does *not* create a new div. It renders the children into `domNode`.
  // `domNode` is any valid DOM node, regardless of its location in the DOM.
  return React.createPortal(
    this.props.children,
    domNode,
  );
}
```

A typical use case for portals is when a parent component has an `overflow: hidden` or `z-index` style, but you need the child to visually "break out" of its container. For example, dialogs, hovercards, and tooltips.

> Note:
>
> For most uses portals, you'll need to make sure to follow the proper accessibility guidelines.

[Try out an example on CodePen.](https://codepen.io/acdlite/pen/JrKgmz)

## Portals and event bubbling

A nice feature of portals is that, even though the DOM node can be anywhere in the DOM tree, it behaves like a normal React child in every other way. Features like context work exactly the same regardless of whether the child is a portal. 

This includes event bubbling: an event fired from inside a portal will propagate to ancestors in the containing *React tree*, even if those elements are not ancestors in the *DOM tree*:

```js
// These two containers are siblings in the DOM
const appContainer = document.getElementById('app-container');
const modalContainer = document.getElementById('modal-container');

class Parent extends React.Component {
  state = {clicks: 0};
  onClick = () => {
    // This will fire when the button in Child is clicked, even though
    // button is not direct descendant in the DOM.
    this.setState(state => ({clicks: state.clicks + 1}));
  };
  render() {
    return (
      <div onClick={this.onClick}>
        <p>Number of clicks: {this.state.clicks}</p>
        <p>Open up the browser DevTools to observe that the button is not a child the div with onClick handler.</p>
        {ReactDOM.createPortal(<Child />, modalContainer)}
      </div>
    );
  }
}

function Child() {
  return <button>Click</button>;
}


ReactDOM.render(<Parent />, appContainer);
```

[Try this example on CodePen](https://codepen.io/acdlite/pen/MEJEVV).

The advantage of treating portal event bubbling this way is that it makes it easier to build abstractions. For example, if you render a `<Modal />` component, the parent can capture its events regardless of whether it's implemented using portals.