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

The next few sections will gradually introduce you to using React. We will examine the building blocks of React apps: elements and components. Once you master them, you can create complex apps from small reusable pieces.
