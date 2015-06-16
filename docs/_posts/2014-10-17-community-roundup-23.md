---
title: "Community Round-up #23"
layout: post
author: LoukaN
---

This round-up is a special edition on [Flux](https://facebook.github.io/flux/). If you expect to see diagrams showing arrows that all point in the same direction, you won't be disappointed!

## React And Flux at ForwardJS

Facebook engineers [Jing Chen](https://github.com/jingc) and [Bill Fisher](https://github.com/fisherwebdev) gave a talk about Flux and React at [ForwardJS](http://forwardjs.com/), and how using an application architecture with a unidirectional data flow helped solve recurring bugs.

<iframe width="650" height="315" src="//www.youtube-nocookie.com/embed/i__969noyAM" frameborder="0" allowfullscreen></iframe>

# Yahoo

Yahoo is converting Yahoo Mail to React and Flux and in the process, they open sourced several components. This will help you get an isomorphic application up and running.

- [Flux Router Component](https://github.com/yahoo/flux-router-component)
- [Dispatchr](https://github.com/yahoo/dispatchr)
- [Fetchr](https://github.com/yahoo/fetchr)
- [Flux Examples](https://github.com/yahoo/flux-examples)


## Reflux

[Mikael Brassman](https://spoike.ghost.io/) wrote [Reflux](https://github.com/spoike/refluxjs), a library that implements Flux concepts. Note that it diverges significantly from the way we use Flux at Facebook. He explains [the reasons why in a blog post](https://spoike.ghost.io/deconstructing-reactjss-flux/).

<center>
<a href="https://spoike.ghost.io/deconstructing-reactjss-flux/"><img src="/react/img/blog/reflux-flux.png" width="400" /></a>
</center>


## React and Flux Interview

[Ian Obermiller](http://ianobermiller.com/), engineer at Facebook, [made a lengthy interview](http://ianobermiller.com/blog/2014/09/15/react-and-flux-interview/) on the experience of using React and Flux in order to build probably the biggest React application ever written so far.

> I’ve actually said this many times to my team too, I love React. It’s really great for making these complex applications. One thing that really surprised me with it is that React combined with a sane module system like CommonJS, and making sure that you actually modulize your stuff properly has scaled really well to a team of almost 10 developers working on hundreds of files and tens of thousands of lines of code.
>
> Really, a fairly large code base... stuff just works. You don’t have to worry about mutating, and the state of the DOM just really makes stuff easy. Just conceptually it’s easier just to think about here’s what I have, here’s my data, here’s how it renders, I don’t care about anything else. For most cases that is really simplifying and makes it really fast to do stuff.
>
> [Read the full interview...](http://ianobermiller.com/blog/2014/09/15/react-and-flux-interview/)


## Adobe's Brackets Project Tree

[Kevin Dangoor](http://www.kevindangoor.com/) is converting the project tree of [Adobe's Bracket text editor](http://brackets.io/) to React and Flux. He wrote about his experience [using Flux](http://www.kevindangoor.com/2014/09/intro-to-the-new-brackets-project-tree/).

<center>
<a href="http://www.kevindangoor.com/2014/09/intro-to-the-new-brackets-project-tree/"><img src="/react/img/blog/flux-diagram.png" width="400" /></a>
</center>


## Async Requests with Flux Revisited

[Reto Schläpfer](http://www.code-experience.com/the-code-experience/) came back to a Flux project he hasn't worked on for a month and [saw many ways to improve the way he implemented Flux](http://www.code-experience.com/async-requests-with-react-js-and-flux-revisited/). He summarized his learnings in a blog post.

> The smarter way is to call the Web Api directly from an Action Creator and then make the Api dispatch an event with the request result as a payload. The Store(s) can choose to listen on those request actions and change their state accordingly.
>
> Before I show some updated code snippets, let me explain why this is superior:
>
> - There should be only one channel for all state changes: The Dispatcher. This makes debugging easy because it just requires a single console.log in the dispatcher to observe every single state change trigger.
>
> - Asynchronously executed callbacks should not leak into Stores. The consequences of it are just too hard to fully foresee. This leads to elusive bugs. Stores should only execute synchronous code. Otherwise they are too hard to understand.
>
> - Avoiding actions firing other actions makes your app simple. We use the newest Dispatcher implementation from Facebook that does not allow a new dispatch while dispatching. It forces you to do things right.
>
> [Read the full article...](http://www.code-experience.com/async-requests-with-react-js-and-flux-revisited/)


## Undo-Redo with Immutable Data Structures

[Ameya Karve](https://github.com/ameyakarve) explained how to use [Mori](https://github.com/swannodette/mori), a library that provides immutable data structures, in order to [implement undo-redo](http://ameyakarve.com/jekyll/update/2014/02/06/Undo-React-Flux-Mori.html). This usually very challenging feature only takes a few lines of code with Flux!

```javascript
undo: function() {
  this.redoStates = Mori.conj(this.redoStates, Mori.first(this.undoStates));
  this.undoStates = Mori.drop(1, this.undoStates);
  this.todosState = Mori.first(this.undoStates);
  this.canUndo = Mori.count(this.undoStates) > 1;
  this.canRedo = true;
  if (Mori.count(this.undoStates) > 1) {
    this.todos = JSON.parse(this.todosState);
  } else {
    this.todos = [];
  }
  this.emit('change');
},
```


## Flux in practice

[Gary Chambers](https://twitter.com/garychambers108) wrote a [guide to get started with Flux](https://medium.com/@garychambers108/flux-in-practice-ec08daa9041a). This is a very practical introduction to Flux.

> So, what does it actually mean to write an application in the Flux way? At that moment of inspiration, when faced with an empty text editor, how should you begin? This post follows the process of building a Flux-compliant application from scratch.
>
> [Read the full guide...](https://medium.com/@garychambers108/flux-in-practice-ec08daa9041a)


## Components, React and Flux

[Dan Abramov](https://twitter.com/dan_abramov) working at Stampsy made a talk about React and Flux. It's a very good overview of the concepts at play.

<iframe src="//slides.com/danabramov/components-react-flux-wip/embed"  width="650" height="315" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


## React and Flux

[Christian Alfoni](https://github.com/christianalfoni) wrote an article where [he compares Backbone, Angular and Flux](https://christianalfoni.github.io/javascript/2014/08/20/react-js-and-flux.html) on a simple example that's representative of a real project he worked on.

> Wow, that was a bit more code! Well, try to think of it like this. In the above examples, if we were to do any changes to the application we would probably have to move things around. In the FLUX example we have considered that from the start.
>
> Any changes to the application is adding, not moving things around. If you need a new store, just add it and make components dependant of it. If you need more views, create a component and use it inside any other component without affecting their current "parent controller or models".
>
> [Read the full article...](https://christianalfoni.github.io/javascript/2014/08/20/react-js-and-flux.html)



## Flux: Step by Step approach

[Nicola Paolucci](https://github.com/durdn) from Atlassian wrote a great guide to help your getting understand [Flux step by step](https://blogs.atlassian.com/2014/08/flux-architecture-step-by-step/).

<center>
<a href="https://blogs.atlassian.com/2014/08/flux-architecture-step-by-step/"><img src="/react/img/blog/flux-chart.png" width="400" /></a>
</center>


## DeLorean: Back to the future!

[DeLorean](https://github.com/deloreanjs/delorean) is a tiny Flux pattern implementation developed by [Fatih Kadir Akin](https://github.com/f).

>
- Unidirectional data flow, it makes your app logic simpler than MVC
- Automatically listens to data changes and keeps your data updated
- Makes data more consistent across your whole application
- It's framework agnostic, completely. There's no view framework dependency
- Very small, just 4K gzipped
- Built-in React.js integration, easy to use with Flight.js and Ractive.js and probably all others
- Improve your UI/data consistency using rollbacks


## Facebook's iOS Infrastructure

Last but not least, Flux and React ideas are not limited to JavaScript inside of the browser. The iOS team at Facebook re-implemented Newsfeed using very similar patterns.

<iframe width="650" height="315" src="//www.youtube-nocookie.com/embed/XhXC4SKOGfQ" frameborder="0" allowfullscreen></iframe>


## Random Tweet

<blockquote class="twitter-tweet" lang="en"><p>If you build your app with flux, you can swap out React for a canvas or svg view layer and keep 85% of your code. (or the thing after React)</p>&mdash; Ryan Florence (@ryanflorence) <a href="https://twitter.com/ryanflorence/status/507309645372076034">September 3, 2014</a></blockquote>
