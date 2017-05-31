---
title: "Community Round-up #1"
author: vjeux
---

React was open sourced two weeks ago and it's time for a little round-up of what has been going on.

## Khan Academy Question Editor

It looks like [Ben Alpert](http://benalpert.com/) is the first person outside of Facebook and Instagram to push React code to production. We are very grateful for his contributions in form of pull requests, bug reports and presence on IRC ([#reactjs on Freenode](irc://chat.freenode.net/reactjs)). Ben wrote about his experience using React:

> I just rewrote a 2000-line project in React and have now made a handful of pull requests to React. Everything about React I've seen so far seems really well thought-out and I'm proud to be the first non-FB/IG production user of React.
>
> The project that I rewrote in React (and am continuing to improve) is the Khan Academy question editor which content creators can use to enter questions and hints that will be presented to students:
> <figure>[![](/react/img/blog/khan-academy-editor.png)](http://benalpert.com/2013/06/09/using-react-to-speed-up-khan-academy.html)</figure>
>
> [Read the full post...](http://benalpert.com/2013/06/09/using-react-to-speed-up-khan-academy.html)

## Pimp my Backbone.View (by replacing it with React)

[Paul Seiffert](https://blog.mayflower.de/) wrote a blog post that explains how to integrate React into Backbone applications.

> React has some interesting concepts for JavaScript view objects that can be used to eliminate this one big problem I have with Backbone.js.
>
> As in most MVC implementations (although React is probably just a VC implementation), a view is one portion of the screen that is managed by a controlling object. This object is responsible for deciding when to re-render the view and how to react to user input. With React, these view-controllers objects are called components. A component knows how to render its view and how to handle to the user's interaction with it.
>
> The interesting thing is that React is figuring out by itself when to re-render a view and how to do this in the most efficient way.
>
> [Read the full post...](https://blog.mayflower.de/3937-Backbone-React.html)

## Using facebook's React with require.js

[Mario Mueller](http://blog.xenji.com/) wrote a menu component in React and was able to easily integrate it with require.js, EventEmitter2 and bower.

> I recently stumbled upon facebook's React library, which is a JavaScript library for building reusable frontend components. Even if this lib is only at version 0.3.x it behaves very stable, it is fast and is fun to code. I'm a big fan of require.js, so I tried to use React within the require.js eco system. It was not as hard as expected and here are some examples and some thoughts about it.
>
> [Read the full post...](http://blog.xenji.com/2013/06/facebooks-react-require-js.html)

## Origins of React

[Pete Hunt](http://www.petehunt.net/blog/) explained what differentiates React from other JavaScript libraries in [a previous blog post](/react/blog/2013/06/05/why-react.html). [Lee Byron](http://leebyron.com/) gives another perspective on Quora:

> React isn't quite like any other popular JavaScript libraries, and it solves a very specific problem: complex UI rendering. It's also intended to be used along side many other popular libraries. For example, React works well with Backbone.js, amongst many others.
>
> React was born out of frustrations with the common pattern of writing two-way data bindings in complex MVC apps. React is an implementation of one-way data bindings.
>
> [Read the full post...](https://www.quora.com/React-JS-Library/How-is-Facebooks-React-JavaScript-library/answer/Lee-Byron?srid=3DcX)
