---
title: "Community Round-up #18"
author: Jonas Gebhardt
---

In this Round-up, we are taking a few closer looks at React's interplay with different frameworks and architectures.

## "Little framework BIG splash"

Let's start with yet another refreshing introduction to React: Craig Savolainen ([@maedhr](https://twitter.com/maedhr)) walks through some first steps, demonstrating [how to build a Google Maps component](http://infinitemonkeys.influitive.com/little-framework-big-splash) using React.

## Architecting your app with react

Brandon Konkle ([@bkonkle](https://twitter.com/bkonkle))
[Architecting your app with react](http://lincolnloop.com/blog/architecting-your-app-react-part-1/)
We're looking forward to part 2!

> React is not a full MVC framework, and this is actually one of its strengths. Many who adopt React choose to do so alongside their favorite MVC framework, like Backbone. React has no opinions about routing or syncing data, so you can easily use your favorite tools to handle those aspects of your frontend application. You'll often see React used to manage specific parts of an application's UI and not others. React really shines, however, when you fully embrace its strategies and make it the core of your application's interface.
>
> [Read the full article...](http://lincolnloop.com/blog/architecting-your-app-react-part-1/)

## React vs. async DOM manipulation

Eliseu Monar ([@eliseumds](https://twitter.com/eliseumds))'s post "[ReactJS vs async concurrent rendering](http://eliseumds.tumblr.com/post/77843550010/vitalbox-pchr-reactjs-vs-async-concurrent-rendering)" is a great example of how React quite literally renders a whole array of common web development work(arounds) obsolete.



## React, Scala and the Play Framework
[Matthias Nehlsen](http://matthiasnehlsen.com/) wrote a detailed introductory piece on [React and the Play Framework](http://matthiasnehlsen.com/blog/2014/01/05/play-framework-and-facebooks-react-library/), including a helpful architectural diagram of a typical React app.

Nehlsen's React frontend is the second implementation of his chat application's frontend, following an AngularJS version. Both implementations are functionally equivalent and offer some perspective on differences between the two frameworks.

In [another article](http://matthiasnehlsen.com/blog/2014/01/24/scala-dot-js-and-reactjs/), he walks us through the process of using React with scala.js to implement app-wide undo functionality.

Also check out his [talk](http://m.ustream.tv/recorded/42780242) at Ping Conference 2014, in which he walks through a lot of the previously content in great detail.

## React and Backbone

The folks over at [Venmo](https://venmo.com/) are using React in conjunction with Backbone.
Thomas Boyt ([@thomasaboyt](https://twitter.com/thomasaboyt)) wrote [this detailed piece](http://www.thomasboyt.com/2013/12/17/using-reactjs-as-a-backbone-view.html) about why React and Backbone are "a fantastic pairing".

## React vs. Ember

Eric Berry ([@coderberry](https://twitter.com/coderberry)) developed Ember equivalents for some of the official React examples. Read his post for a side-by-side comparison of the respective implementations: ["Facebook React vs. Ember"](http://instructure.github.io/blog/2013/12/17/facebook-react-vs-ember/).


## React and plain old HTML

Daniel Lo Nigro ([@Daniel15](https://twitter.com/Daniel15)) created [React-Magic](https://github.com/reactjs/react-magic), which leverages React to ajaxify plain old html pages and even [allows CSS transitions between pageloads](http://stuff.dan.cx/facebook/react-hacks/magic/red.php).

> React-Magic intercepts all navigation (link clicks and form posts) and loads the requested page via an AJAX request. React is then used to "diff" the old HTML with the new HTML, and only update the parts of the DOM that have been changed.
>
> [Check out the project on GitHub...](https://github.com/reactjs/react-magic)

On a related note, [Reactize](https://turbo-react.herokuapp.com/) by Ross Allen ([@ssorallen](https://twitter.com/ssorallen)) is a similarly awesome project: A wrapper for Rails' [Turbolinks](https://github.com/rails/turbolinks/), which seems to have inspired John Lynch ([@johnrlynch](https://twitter.com/johnrlynch)) to then create [a server-rendered version using the JSX transformer in Rails middleware](http://www.rigelgroupllc.com/blog/2014/01/12/react-jsx-transformer-in-rails-middleware/).

## React and Object.observe
Check out [François de Campredon](https://github.com/fdecampredon)'s implementation of [TodoMVC based on React and ES6's Object.observe](https://github.com/fdecampredon/react-observe-todomvc/).


## React and Angular

Ian Bicking ([@ianbicking](https://twitter.com/ianbicking)) of Mozilla Labs [explains why he "decided to go with React instead of Angular.js"](https://plus.google.com/+IanBicking/posts/Qj8R5SWAsfE).

### ng-React Update

[David Chang](https://github.com/davidchang) works through some performance improvements of his [ngReact](https://github.com/davidchang/ngReact) project. His post ["ng-React Update - React 0.9 and Angular Track By"](http://davidandsuzi.com/ngreact-update/) includes some helpful advice on boosting render performance for Angular components.

> Angular gives you a ton of functionality out of the box - a full MV* framework - and I am a big fan, but I'll admit that you need to know how to twist the right knobs to get performance.
>
> That said, React gives you a very strong view component out of the box with the performance baked right in. Try as I did, I couldn't actually get it any faster. So pretty impressive stuff.
>
>[Read the full post...](http://davidandsuzi.com/ngreact-update/)


React was also recently mentioned at ng-conf, where the Angular team commented on React's concept of the virtual DOM:

<iframe width="560" height="315" src="//www.youtube.com/embed/srt3OBP2kGc?start=113" frameborder="0" allowfullscreen></iframe>

## React and Web Components

Jonathan Krause ([@jonykrause](https://twitter.com/jonykrause)) offers his thoughts regarding [parallels between React and Web Components](http://jonykrau.se/posts/the-value-of-react), highlighting the value of React's ability to render pages on the server practically for free.

## Immutable React

[Peter Hausel](http://pk11.kinja.com/) shows how to build a Wikipedia auto-complete demo based on immutable data structures (similar to [mori](https://npmjs.org/package/mori)), really taking advantage of the framework's one-way reactive data binding:

> Its truly reactive design makes DOM updates finally sane and when combined with persistent data structures one can experience JavaScript development like it was never done before.

> [Read the full post](http://tech.kinja.com/immutable-react-1495205675)


## D3 and React

[Ben Smith](http://10consulting.com/) built some great SVG-based charting components using a little less of D3 and a little more of React: [D3 and React - the future of charting components?](http://10consulting.com/2014/02/19/d3-plus-reactjs-for-charting/)

## Om and React
Josh Haberman ([@joshhaberman](https://twitter.com/JoshHaberman)) discusses performance differences between React, Om and traditional MVC frameworks in "[A closer look at OM vs React performance](http://blog.reverberate.org/2014/02/on-future-of-javascript-mvc-frameworks.html)".

Speaking of Om: [Omchaya](https://github.com/sgrove/omchaya) by Sean Grove ([@sgrove](https://twitter.com/sgrove)) is a neat Cljs/Om example project.


## Random Tweets

<div><blockquote class="twitter-tweet" lang="en"><p>Worked for 2 hours on a [@react_js](https://twitter.com/react_js) app sans internet. Love that I could get stuff done with it without googling every question.</p>&mdash; John Shimek (@varikin) <a href="https://twitter.com/varikin/status/436606891657949185">February 20, 2014</a></blockquote></div>
