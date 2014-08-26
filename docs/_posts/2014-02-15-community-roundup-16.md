---
title: "Community Round-up #16"
author: Jonas Gebhardt
---

There have been many posts recently covering the <i>why</i> and <i>how</i> of React. This week's community round-up includes a collection of recent articles to help you get started with React, along with a few posts that explain some of the inner workings.


## React in a nutshell
Got five minutes to pitch React to your coworkers? John Lynch ([@johnrlynch](https://twitter.com/johnrlynch)) put together [this excellent and refreshing slideshow](http://slid.es/johnlynch/reactjs):

<iframe src="//slid.es/johnlynch/reactjs/embed" width="576" height="420" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>



## React's diff algorithm

React core team member Christopher Chedeau ([@vjeux](https://twitter.com/vjeux)) explores the innards of React's tree diffing algorithm in this [extensive and well-illustrated post](http://calendar.perfplanet.com/2013/diff/). <figure>[![](/react/img/blog/react-diff-tree.png)](http://calendar.perfplanet.com/2013/diff/)</figure>

While we're talking about tree diffing: Matt Esch ([@MatthewEsch](https://twitter.com/MatthewEsch)) created [this project](https://github.com/Matt-Esch/virtual-dom), which aims to implement the virtual DOM and a corresponding diff algorithm as separate modules.




## Many, many new introductions to React!



James Padosley wrote a short post on the basics (and merits) of React: [What is React?](http://james.padolsey.com/javascript/what-is-react/)
> What I like most about React is that it doesn't impose heady design patterns and data-modelling abstractions on me. [...] Its opinions are so minimal and its abstractions so focused on the problem of the DOM, that you can merrily slap your design choices atop.

> [Read the full post...](http://james.padolsey.com/javascript/what-is-react/)

Taylor Lapeyre ([@taylorlapeyre](https://twitter.com/taylorlapeyre)) wrote another nice [introduction to React](http://words.taylorlapeyre.me/an-introduction-to-react).

> React expects you to do the work of getting and pushing data from the server. This makes it very easy to implement React as a front end solution, since it simply expects you to hand it data. React does all the other work.

> [Read the full post...](http://words.taylorlapeyre.me/an-introduction-to-react)


[This "Deep explanation for newbies"](http://www.webdesignporto.com/react-js-in-pure-javascript-facebook-library/?utm_source=echojs&utm_medium=post&utm_campaign=echojs) by [@ProJavaScript](https://twitter.com/ProJavaScript) explains how to get started building a React game without using the optional JSX syntax.

### React around the world

It's great to see the React community expand internationally. [This site](http://habrahabr.ru/post/189230/) features a React introduction in Russian.

### React tutorial series

[Christopher Pitt](https://medium.com/@followchrisp) explains [React Components](https://medium.com/react-tutorials/828c397e3dc8) and [React Properties](https://medium.com/react-tutorials/ef11cd55caa0). The former includes a nice introduction to using JSX, while the latter focuses on adding interactivity and linking multiple components together. Also check out the [other posts in his React Tutorial series](https://medium.com/react-tutorials), e.g. on using [React + Backbone Model](https://medium.com/react-tutorials/8aaec65a546c) and [React + Backbone Router](https://medium.com/react-tutorials/c00be0cf1592).

### Beginner tutorial: Implementing the board game Go

[Chris LaRose](http://cjlarose.com/) walks through the steps of creating a Go app in React, showing how to separate application logic from the rendered components. Check out his [tutorial](http://cjlarose.com/2014/01/09/react-board-game-tutorial.html) or go straight to the [code](https://github.com/cjlarose/react-go).

### Egghead.io video tutorials

Joe Maddalone ([@joemaddalone](https://twitter.com/joemaddalone)) of [egghead.io](https://egghead.io/) created a series of React video tutorials, such as [this](http://www.youtube.com/watch?v=rFvZydtmsxM&feature=youtu.be&a) introduction to React Components. [[part 1](http://www.youtube.com/watch?v=rFvZydtmsxM&feature=youtu.be&a)], [[part 2](http://www.youtube.com/watch?v=5yvFLrt7N8M)]

### "React: Finally, a great server/client web stack"

Eric Florenzano ([@ericflo](https://twitter.com/ericflo)) sheds some light on what makes React perfect for server rendering:

> [...] the ideal solution would fully render the markup on the server, deliver it to the client so that it can be shown to the user instantly. Then it would asynchronously load some Javascript that would attach to the rendered markup, and invisibly promote the page into a full app that can render its own markup. [...]

> What I've discovered is that enough of the pieces have come together, that this futuristic-sounding web environment is actually surprisingly easy to do now with React.js.

> [Read the full post...](http://eflorenzano.com/blog/2014/01/23/react-finally-server-client/)

## Building a complex React component
[Matt Harrison](http://matt-harrison.com/) walks through the process of [creating an SVG-based Resistance Calculator](http://matt-harrison.com/building-a-complex-web-component-with-facebooks-react-library/) using React. <figure>[![](/react/img/blog/resistance-calculator.png)](http://matt-harrison.com/building-a-complex-web-component-with-facebooks-react-library/)</figure>



## Random Tweets

<div><blockquote class="twitter-tweet" lang="en"><p>[#reactjs](https://twitter.com/search?q=%23reactjs&src=hash) has very simple API, but it's amazing how much work has been done under the hood to make it blazing fast.</p>&mdash; Anton Astashov (@anton_astashov) <a href="https://twitter.com/anton_astashov/status/417556491646693378">December 30, 2013</a></blockquote></div>

<div><blockquote class="twitter-tweet" lang="en"><p>[#reactjs]((https://twitter.com/search?q=%23reactjs&src=hash) makes refactoring your HTML as easy & natural as refactoring your javascript [@react_js](https://twitter.com/react_js)</p>&mdash; Jared Forsyth (@jaredforsyth) <a href="https://twitter.com/jaredforsyth/status/420304083010854912">January 6, 2014</a></blockquote></div>

<div><blockquote class="twitter-tweet" lang="en"><p>Played with react.js for an hour, so many things suddenly became stupidly simple.</p>&mdash; andrewingram (@andrewingram) <a href="https://twitter.com/andrewingram/status/422810480701620225">January 13, 2014</a></blockquote></div>

<div><blockquote class="twitter-tweet" lang="en"><p>[@okonetchnikov](https://twitter.com/okonetchnikov) HOLY CRAP react is nice</p>&mdash; julik (@julikt) <a href="https://twitter.com/julikt/status/422843478792765440">January 13, 2014</a></blockquote></div>

<div><blockquote class="twitter-tweet" lang="en"><p>brb rewriting everything with react
</p>&mdash; Ben Smithett (@bensmithett) <a href="https://twitter.com/bensmithett/status/430671242186592256">February 4, 2014</a></blockquote></div>
