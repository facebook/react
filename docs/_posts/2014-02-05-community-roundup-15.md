---
title: "Community Round-up #15"
author: jgebhardt
---

Interest in React seems to have surged ever since David Nolen ([@swannodette](https://twitter.com/swannodette))'s introduction of [Om](https://github.com/swannodette/om) in his post ["The Future of Javascript MVC Frameworks"](https://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/).

In this React Community Round-up, we are taking a closer look at React from a functional programming perspective.

## "React: Another Level of Indirection"
To start things off, Eric Normand ([@ericnormand](https://twitter.com/ericnormand)) of [LispCast](http://lispcast.com) makes the case for [React from a general functional programming standpoint](http://www.lispcast.com/react-another-level-of-indirection) and explains how React's "Virtual DOM provides the last piece of the Web Frontend Puzzle for ClojureScript".

> The Virtual DOM is an indirection mechanism that solves the difficult problem of DOM programming: how to deal with incremental changes to a stateful tree structure. By abstracting away the statefulness, the Virtual DOM turns the real DOM into an immediate mode GUI, which is perfect for functional programming.
>
> [Read the full post...](http://www.lispcast.com/react-another-level-of-indirection)

## Reagent: Minimalistic React for ClojureScript
Dan Holmsand ([@holmsand](https://twitter.com/holmsand)) created [Reagent](https://holmsand.github.io/reagent/), a simplistic ClojureScript API to React.

> It allows you to define efficient React components using nothing but plain ClojureScript functions and data, that describe your UI using a Hiccup-like syntax.
>
> The goal of Reagent is to make it possible to define arbitrarily complex UIs using just a couple of basic concepts, and to be fast enough by default that you rarely have to care about performance.
>
> [Check it out on GitHub...](https://holmsand.github.io/reagent/)


## Functional DOM programming

React's one-way data-binding naturally lends itself to a functional programming approach. Facebook's Pete Hunt ([@floydophone](https://twitter.com/floydophone)) explores how one would go about [writing web apps in a functional manner](https://medium.com/p/67d81637d43). Spoiler alert:

> This is React. It’s not about templates, or data binding, or DOM manipulation. It’s about using functional programming with a virtual DOM representation to build ambitious, high-performance apps with JavaScript.
>
> [Read the full post...](https://medium.com/p/67d81637d43)

Pete also explains this in detail at his #MeteorDevShop talk (about 30 Minutes):

<iframe width="100%" height="315" src="//www.youtube-nocookie.com/embed/Lqcs6hPOcFw?start=2963" frameborder="0" allowfullscreen></iframe>



## Kioo: Separating markup and logic
[Creighton Kirkendall](https://github.com/ckirkendall) created [Kioo](https://github.com/ckirkendall/kioo), which adds Enlive-style templating to React. HTML templates are separated from the application logic. Kioo comes with separate examples for both Om and Reagent.

A basic example from github:

```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <header>
      <h1>Header placeholder</h1>
      <ul id="navigation">
        <li class="nav-item"><a href="#">Placeholder</a></li>
      </ul>
    </header>
    <div class="content">place holder</div>
  </body>
</html>
```

```clojure
...

(defn my-nav-item [[caption func]]
  (kioo/component "main.html" [:.nav-item]
    {[:a] (do-> (content caption)
                (set-attr :onClick func))}))

(defn my-header [heading nav-elms]
  (kioo/component "main.html" [:header]
    {[:h1] (content heading)
     [:ul] (content (map my-nav-item nav-elms))}))

(defn my-page [data]
  (kioo/component "main.html"
    {[:header] (substitute (my-header (:heading data)
                                      (:navigation data)))
     [:.content] (content (:content data))}))

(def app-state (atom {:heading    "main"
                      :content    "Hello World"
                      :navigation [["home" #(js/alert %)]
                                   ["next" #(js/alert %)]]}))

(om/root app-state my-page (.-body js/document))
```

## Om

In an interview with David Nolen, Tom Coupland ([@tcoupland](https://twitter.com/tcoupland)) of InfoQ provides a nice summary of recent developments around Om ("[Om: Enhancing Facebook's React with Immutability](http://www.infoq.com/news/2014/01/om-react)").

> David [Nolen]: I think people are starting to see the limitations of just JavaScript and jQuery and even more structured solutions like Backbone, Angular, Ember, etc. React is a fresh approach to the DOM problem that seems obvious in hindsight.
>
> [Read the full interview...](http://www.infoq.com/news/2014/01/om-react)

### A slice of React, ClojureScript and Om

Fredrik Dyrkell ([@lexicallyscoped](https://twitter.com/lexicallyscoped)) rewrote part of the [React tutorial in both ClojureScript and Om](http://www.lexicallyscoped.com/2013/12/25/slice-of-reactjs-and-cljs.html), along with short, helpful explanations.

> React has sparked a lot of interest in the Clojure community lately [...]. At the very core, React lets you build up your DOM representation in a functional fashion by composing pure functions and you have a simple building block for everything: React components.
>
> [Read the full post...](http://www.lexicallyscoped.com/2013/12/25/slice-of-reactjs-and-cljs.html)

In a separate post, Dyrkell breaks down [how to build a binary clock component](http://www.lexicallyscoped.com/2014/01/23/ClojureScript-react-om-binary-clock.html) in Om.

[[Demo](http://www.lexicallyscoped.com/demo/binclock/)] [[Code](https://github.com/fredyr/binclock/blob/master/src/binclock/core.cljs)]

### Time Travel: Implementing undo in Om
David Nolen shows how to leverage immutable data structures to [add global undo](https://swannodette.github.io/2013/12/31/time-travel/) functionality to an app – using just 13 lines of ClojureScript.

### A Step-by-Step Om Walkthrough

[Josh Lehman](http://www.joshlehman.me) took the time to create an extensive [step-by-step walkthrough](http://www.joshlehman.me/rewriting-the-react-tutorial-in-om/) of the React tutorial in Om. The well-documented source is on [github](https://github.com/jalehman/omtut-starter).

### Omkara

[brendanyounger](https://github.com/brendanyounger) created [omkara](https://github.com/brendanyounger/omkara), a starting point for ClojureScript web apps based on Om/React. It aims to take advantage of server-side rendering and comes with a few tips on getting started with Om/React projects.

### Om Experience Report
Adam Solove ([@asolove](https://twitter.com/asolove/)) [dives a little deeper into Om, React and ClojureScript](http://adamsolove.com/js/clojure/2014/01/06/om-experience-report.html). He shares some helpful tips he gathered while building his [CartoCrayon](https://github.com/asolove/carto-crayon) prototype.

## Not-so-random Tweet


<div><blockquote class="twitter-tweet" lang="en"><p>[@swannodette](https://twitter.com/swannodette) No thank you! It's honestly a bit weird because Om is exactly what I didn't know I wanted for doing functional UI work.</p>&mdash; Adam Solove (@asolove) <a href="https://twitter.com/asolove/status/420294067637858304">January 6, 2014</a></blockquote></div>
