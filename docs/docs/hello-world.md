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

## A Note on JavaScript

React is a JavaScript library, and so it assumes you have a basic understanding of the JavaScript language. If you don't feel very confident, we recommend to [refresh your JavaScript knowledge](https://developer.mozilla.org/en-US/docs/Web/JavaScript/A_re-introduction_to_JavaScript) so you can follow along more easily.

We also use some of the ES2015 syntax in the examples. We try to use it sparingly because it's still relatively new, but we encourage you to get familiar with [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes), [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), and [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) statements. You can use <a href="http://babeljs.io/repl/#?babili=false&evaluate=true&lineWrap=false&presets=es2015%2Creact&experimental=false&loose=false&spec=false&code=const%20element%20%3D%20%3Ch1%3EHello%2C%20world!%3C%2Fh1%3E%3B%0Aconst%20container%20%3D%20document.getElementById('root')%3B%0AReactDOM.render(element%2C%20container)%3B%0A">Babel REPL</a> to check what ES2015 code compiles to.
