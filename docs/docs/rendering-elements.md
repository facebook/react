---
id: rendering-elements
title: Rendering Elements
permalink: docs/rendering-elements.html
prev: introducing-jsx.html
next: components-and-props.html
---

Elements are the smallest building blocks of React apps.

An element describes what you want to see on the screen:

```js
const element = <h1>Hello, world</h1>;
```

Unlike browser DOM elements, React elements are plain objects, and are cheap to create. React DOM takes care of updating the DOM to match the React elements.

## Rendering an Element into the DOM

Let's say there is a `<div>` somewhere in your HTML file:

```html
<div id="root"></div>
```

We call this a "container" DOM node because the React app is contained by it. Everything inside it will be managed by React DOM.

Applications built with just React usually have a single container node. If you are integrating React into an existing app, you may have as many isolated container nodes as you like.

To render a React element into a DOM container, pass both to `ReactDOM.render()`:

```js{3}
const container = document.getElementById('root');
const element = <h1>Hello, world</h1>;
ReactDOM.render(element, container);
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/rrpgNB?editors=1010)

It displays "Hello World" on the page.

## Updating the Rendered Element

React elements are [immutable](https://en.wikipedia.org/wiki/Immutable_object). Once you create an element, you can't change it.

When we want the UI to update, we create a new element, and pass it to `ReactDOM.render()`. It updates the DOM to match the newly passed element.

Consider this ticking clock example:

```js{10}
const container = document.getElementById('root');

function tick() {
  const element = (
    <div>
      <h1>Hello, world!</h1>
      <h2>It is {new Date().toLocaleTimeString()}.</h2>
    </div>
  );
  ReactDOM.render(element, container);
}

setInterval(tick, 1000);
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/gwoJZk?editors=0010)

It calls `ReactDOM.render()` every second from a [`setInterval()`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval) callback.

## React Only Updates What's Necessary

React DOM compares the element and its children to the previous one, and only applies the minimal DOM updates necessary to bring the DOM to the desired state.

You can verify by inspecting the [last example](http://codepen.io/gaearon/pen/gwoJZk?editors=0010) with the browser tools:

![DOM inspector showing granular updates](/react/img/docs/granular-dom-updates.gif)

Even though we create an element describing the whole UI tree on every tick, only the text node whose contents has changed gets updated by React DOM.

In our experience, thinking about how the UI should look at any given moment rather than how to change it over time eliminates a whole class of bugs.
