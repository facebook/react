---
id: hello-world
title: Hello World
permalink: docs/hello-world.html
prev: installation.html
next: introducing-jsx.html
---

The next sections assume you are following along [using CodePen or an HTML file](/react/docs/installation.html#trying-out-react). If you use [Create React App](/react/docs/installation.html#creating-a-single-page-application) or [npm](/react/docs/installation.html#using-npm), you will need to import `react` and `react-dom`:

```js
import React from 'react';
import ReactDOM from 'react-dom';
```

The smallest React example looks like this:

```js
const element = <h1>Hello, world!</h1>;
const container = document.getElementById('root');
ReactDOM.render(element, container);
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/ZpvBNJ?editors=0010)

It renders a header saying "Hello World" on the page.

The next few sections will gradually introduce you to using React. We will examine the building blocks of React apps: elements and components. Once you master them, you can create complex apps from small reusable pieces.
