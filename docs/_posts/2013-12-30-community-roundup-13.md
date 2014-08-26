---
title: "Community Round-up #13"
author: Vjeux
---

Happy holidays! This blog post is a little-late Christmas present for all the React users. Hopefully it will inspire you to write awesome web apps in 2014!


## React Touch

[Pete Hunt](http://www.petehunt.net/) wrote three demos showing that React can be used to run 60fps native-like experiences on mobile web. A frosted glass effect, an image gallery with 3d animations and an infinite scroll view.

<figure><iframe src="//player.vimeo.com/video/79659941" width="220" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></figure>

[Try out the demos!](http://petehunt.github.io/react-touch/)


## Introduction to React

[Stoyan Stefanov](http://www.phpied.com/) talked at Joe Dev On Tech about React. He goes over all the features of the library and ends with a concrete example.

<figure><iframe width="560" height="315" src="//www.youtube.com/embed/SMMRJif5QW0" frameborder="0" allowfullscreen></iframe></figure>


## JSX: E4X The Good Parts

JSX is often compared to the now defunct E4X, [Vjeux](http://blog.vjeux.com/) went over all the E4X features and explained how JSX is different and hopefully doesn't repeat the same mistakes.

> E4X (ECMAScript for XML) is a Javascript syntax extension and a runtime to manipulate XML. It was promoted by Mozilla but failed to become mainstream and is now deprecated. JSX was inspired by E4X. In this article, I'm going to go over all the features of E4X and explain the design decisions behind JSX.
>
> **Historical Context**
>
> E4X has been created in 2002 by John Schneider. This was the golden age of XML where it was being used for everything: data, configuration files, code, interfaces (DOM) ... E4X was first implemented inside of Rhino, a Javascript implementation from Mozilla written in Java.
>
> [Continue reading ...](http://blog.vjeux.com/2013/javascript/jsx-e4x-the-good-parts.html)


## React + Socket.io

[Geert Pasteels](http://enome.be/nl) made a small experiment with Socket.io. He wrote a very small mixin that synchronizes React state with the server. Just include this mixin to your React component and it is now live!

```javascript
changeHandler: function (data) {
  if (!_.isEqual(data.state, this.state) && this.path === data.path) {
    this.setState(data.state);
  }
},
componentDidMount: function (root) {
  this.path = utils.nodePath(root);
  socket.on('component-change', this.changeHandler);
},
componentWillUpdate: function (props, state) {
  socket.emit('component-change', { path: this.path, state: state });
},
componentWillUnmount: function () {
  socket.removeListener('component-change', this.change);
}
```

[Check it out on GitHub...](https://github.com/Enome/react.io)


## cssobjectify

[Andrey Popp](http://andreypopp.com/) implemented a source transform that takes a CSS file and converts it to JSON. This integrates pretty nicely with React.

```javascript
/* style.css */
MyComponent {
  font-size: 12px;
  background-color: red;
}

/* myapp.js */
var React = require('react-tools/build/modules/React');
var Styles = require('./styles.css');

var MyComponent = React.createClass({
  render: function() {
    return (
      <div style={Styles.MyComponent}>
        Hello, world!
      </div>
    )
  }
});
```

[Check it out on GitHub...](https://github.com/andreypopp/cssobjectify)


## ngReact

[David Chang](http://davidandsuzi.com/) working at [HasOffer](http://www.hasoffers.com/) wanted to speed up his Angular app and replaced Angular primitives by React at different layers. When using React naively it is 67% faster, but when combining it with angular's transclusion it is 450% slower.

> Rendering this takes 803ms for 10 iterations, hovering around 35 and 55ms for each data reload (that's 67% faster). You'll notice that the first load takes a little longer than successive loads, and the second load REALLY struggles - here, it's 433ms, which is more than half of the total time!
> <figure>[![](/react/img/blog/ngreact.png)](http://davidandsuzi.com/ngreact-react-components-in-angular/)</figure>
>
> [Read the full article...](http://davidandsuzi.com/ngreact-react-components-in-angular/)


## vim-jsx

[Max Wang](https://github.com/mxw) made a vim syntax highlighting and indentation plugin for vim.

> Syntax highlighting and indenting for JSX. JSX is a JavaScript syntax transformer which translates inline XML document fragments into JavaScript objects. It was developed by Facebook alongside React.
>
> This bundle requires pangloss's [vim-javascript](https://github.com/pangloss/vim-javascript) syntax highlighting.
>
> Vim support for inline XML in JS is remarkably similar to the same for PHP.
>
> [View on GitHub...](https://github.com/mxw/vim-jsx)


## Random Tweet

<center><blockquote class="twitter-tweet" lang="en"><p>I may be starting to get annoying with this, but ReactJS is really exciting. I truly feel the virtual DOM is a game changer.</p>&mdash; Eric Florenzano (@ericflo) <a href="https://twitter.com/ericflo/statuses/413842834974732288">December 20, 2013</a></blockquote></center>

