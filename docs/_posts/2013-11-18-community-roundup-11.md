---
title: "Community Round-up #11"
author: vjeux
---

This round-up is the proof that React has taken off from its Facebook's root: it features three in-depth presentations of React done by external people. This is awesome, keep them coming!

## Super VanJS 2013 Talk

[Steve Luscher](https://github.com/steveluscher) working at [LeanPub](https://leanpub.com/) made a 30 min talk at [Super VanJS](https://twitter.com/vanjs). He does a remarkable job at explaining why React is so fast with very exciting demos using the HTML5 Audio API.

<figure><iframe width="600" height="338" src="//www.youtube-nocookie.com/embed/1OeXsL5mr4g" frameborder="0" allowfullscreen></iframe></figure>


## React Tips

[Connor McSheffrey](http://connormcsheffrey.com/) and [Cheng Lou](https://github.com/chenglou) added a new section to the documentation. It's a list of small tips that you will probably find useful while working on React. Since each article is very small and focused, we [encourage you to contribute](/react/tips/introduction.html)!

- [Inline Styles](/react/tips/inline-styles.html)
- [If-Else in JSX](/react/tips/if-else-in-JSX.html)
- [Self-Closing Tag](/react/tips/self-closing-tag.html)
- [Maximum Number of JSX Root Nodes](/react/tips/maximum-number-of-jsx-root-nodes.html)
- [Shorthand for Specifying Pixel Values in style props](/react/tips/style-props-value-px.html)
- [Type of the Children props](/react/tips/children-props-type.html)
- [Value of null for Controlled Input](/react/tips/controlled-input-null-value.html)
- [`componentWillReceiveProps` Not Triggered After Mounting](/react/tips/componentWillReceiveProps-not-triggered-after-mounting.html)
- [Props in getInitialState Is an Anti-Pattern](/react/tips/props-in-getInitialState-as-anti-pattern.html)
- [DOM Event Listeners in a Component](/react/tips/dom-event-listeners.html)
- [Load Initial Data via AJAX](/react/tips/initial-ajax.html)
- [False in JSX](/react/tips/false-in-jsx.html)


## Intro to the React Framework

[Pavan Podila](http://blog.pixelingene.com/) wrote an in-depth introduction to React on TutsPlus. This is definitively worth reading.

> Within a component-tree, data should always flow down. A parent-component should set the props of a child-component to pass any data from the parent to the child. This is termed as the Owner-Owned pair. On the other hand user-events (mouse, keyboard, touches) will always bubble up from the child all the way to the root component, unless handled in between.
<figure>[![](/react/img/blog/tutsplus.png)](http://dev.tutsplus.com/tutorials/intro-to-the-react-framework--net-35660)</figure>
>
> [Read the full article ...](http://dev.tutsplus.com/tutorials/intro-to-the-react-framework--net-35660)


## 140-characters textarea

[Brian Kim](https://github.com/brainkim) wrote a small textarea component that gradually turns red as you reach the 140-characters limit. Because he only changes the background color, React is smart enough not to mess with the text selection.

<p data-height="178" data-theme-id="0" data-slug-hash="FECGb" data-user="brainkim" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/brainkim/pen/FECGb'>FECGb</a> by Brian Kim (<a href='http://codepen.io/brainkim'>@brainkim</a>) on <a href='http://codepen.io'>CodePen</a></p>
<script async src="//codepen.io/assets/embed/ei.js"></script>


## Genesis Skeleton

[Eric Clemmons](https://ericclemmons.github.io/) is working on a "Modern, opinionated, full-stack starter kit for rapid, streamlined application development". The version 0.4.0 has just been released and has first-class support for React.
<figure>[![](/react/img/blog/genesis_skeleton.png)](http://genesis-skeleton.com/)</figure>


## AgFlow Talk

[Robert Zaremba](http://rz.scale-it.pl/) working on [AgFlow](http://www.agflow.com/) recently talked in Poland about React.

> In a nutshell, I presented why we chose React among other available options (ember.js, angular, backbone ...) in AgFlow, where I’m leading an application development.
>
> During the talk a wanted to highlight that React is not about implementing a Model, but a way to construct visible components with some state. React is simple. It is super simple, you can learn it in 1h. On the other hand what is model? Which functionality it should provide? React does one thing and does it the best (for me)!
>
> [Read the full article...](http://rz.scale-it.pl/2013/10/20/frontend_components_in_react.html)

<figure><iframe src="https://docs.google.com/presentation/d/1JSFbjCuuexwOHCeHWBMNRIJdyfD2Z0ZQwX65WOWkfaI/embed?start=false" frameborder="0" width="600" height="468" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"> </iframe></figure>


## JSX

[Todd Kennedy](http://tck.io/) working at Cond&eacute; Nast wrote [JSXHint](https://github.com/CondeNast/JSXHint) and explains in a blog post his perspective on JSX.

> Lets start with the elephant in the room: JSX?
> Is this some sort of template language? Specifically no. This might have been the first big stumbling block. What looks like to be a templating language is actually an in-line DSL that gets transpiled directly into JavaScript by the JSX transpiler.
>
> Creating elements in memory is quick -- copying those elements into the DOM is where the slowness occurs. This is due to a variety of issues, most namely reflow/paint. Changing the items in the DOM causes the browser to re-paint the display, apply styles, etc. We want to keep those operations to an absolute minimum, especially if we're dealing with something that needs to update the DOM frequently.
>
> [Read the full article...](http://tck.io/posts/jsxhint_and_react.html)


## Photo Gallery

[Maykel Loomans](http://miekd.com/), designer at Instagram, wrote a gallery for photos he shot using React.
<figure>[![](/react/img/blog/xoxo2013.png)](http://photos.miekd.com/xoxo2013/)</figure>


## Random Tweet

<img src="/react/img/blog/steve_reverse.gif" style="float: right;" />
<div style="width: 320px;"><blockquote class="twitter-tweet"><p>I think this reversed gif of Steve Urkel best describes my changing emotions towards the React Lib <a href="http://t.co/JoX0XqSXX3">http://t.co/JoX0XqSXX3</a></p>&mdash; Ryan Seddon (@ryanseddon) <a href="https://twitter.com/ryanseddon/statuses/398572848802852864">November 7, 2013</a></blockquote></div>
