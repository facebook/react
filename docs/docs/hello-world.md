---
id: hello-world
title: Hello World
permalink: docs/hello-world.html
prev: installation.html
next: introducing-jsx.html
---

The smallest React example looks like this:

```js
const element = <h1>Hello, world!</h1>;
const container = document.getElementById('root');
ReactDOM.render(element, container);
```

**[Try it on Codepen.](http://codepen.io/gaearon/pen/ZpvBNJ?editors=0010)**

It renders a header saying "Hello World" on the page.

There are a few things to unpack here:

* What is this XML-like syntax?
* What is a React element?
* What does `ReactDOM.render(element, container)` do?

We will address them one by one in the following sections.
