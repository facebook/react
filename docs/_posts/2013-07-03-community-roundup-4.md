---
title: "Community Round-up #4"
author: Vjeux
---

React reconciliation process appears to be very well suited to implement a text editor with a live preview as people at Khan Academy show us.

## Khan Academy

[Ben Kamens](http://bjk5.com/) explains how [Ben Alpert](http://benalpert.com/) and [Joel Burget](http://joelburget.com/) are promoting React inside of [Khan Academy](https://www.khanacademy.org/). They now have three projects in the works using React.

> Recently two Khan Academy devs dropped into our team chat and said they were gonna use React to write a new feature. They even hinted that we may want to adopt it product-wide.
>
> "The library is only a week old. It's a brand new way of thinking about things. We're the first to use it outside of Facebook. Heck, even the React devs were surprised to hear we're using this in production!!!"
>
> [Read the full post...](http://bjk5.com/post/53742233351/getting-your-team-to-adopt-new-technology)

The best part is the demo of how React reconciliation process makes live editing more user-friendly.

> Our renderer, post-React, is on the left. A typical math editor's preview is on the right.
> <figure>[<img src="/react/img/blog/monkeys.gif" width="70%" />](http://bjk5.com/post/53742233351/getting-your-team-to-adopt-new-technology)</figure>

## React Snippets

Over the past several weeks, members of our team, [Pete Hunt](http://www.petehunt.net/) and [Paul O'Shannessy](http://zpao.com/), answered many questions that were asked in the [React group](https://groups.google.com/forum/#!forum/reactjs). They give a good overview of how to integrate React with other libraries and APIs through the use of [Mixins](/react/docs/reusable-components.html) and [Lifecycle Methods](/react/docs/working-with-the-browser.html).

> [Listening Scroll Event](https://groups.google.com/forum/#!topic/reactjs/l6PnP8qbofk)
>
>  * [JSFiddle](http://jsfiddle.net/aabeL/1/): Basically I've given you two mixins. The first lets you react to global scroll events. The second is, IMO, much more useful: it gives you scroll start and scroll end events, which you can use with setState() to create components that react based on whether the user is scrolling or not.
>
> [Fade-in Transition](https://groups.google.com/forum/#!topic/reactjs/RVAY_eQmdpo)
>
>  * [JSFiddle](http://jsfiddle.net/ufe8k/1/): Creating a new `<FadeInWhenAdded>` component and using jQuery `.fadeIn()` function on the DOM node.
>  * [JSFiddle](http://jsfiddle.net/R8f5L/5/): Using CSS transition instead.
>
> [Socket.IO Integration](https://groups.google.com/forum/#!topic/reactjs/pyUZBRWcHB4)
>
> * [Gist](https://gist.github.com/zpao/5686416): The big thing to notice is that my component is pretty dumb (it doesn't have to be but that's how I chose to model it). All it does is render itself based on the props that are passed in. renderOrUpdate is where the "magic" happens.
> * [Gist](https://gist.github.com/petehunt/5687230): This example is doing everything -- including the IO -- inside of a single React component.
> * [Gist](https://gist.github.com/petehunt/5687276): One pattern that we use at Instagram a lot is to employ separation of concerns and consolidate I/O and state into components higher in the hierarchy to keep the rest of the components mostly stateless and purely display.
>
> [Sortable jQuery Plugin Integration](https://groups.google.com/forum/#!topic/reactjs/mHfBGI3Qwz4)
>
> * [JSFiddle](http://jsfiddle.net/LQxy7/): Your React component simply render empty divs, and then in componentDidMount() you call React.renderComponent() on each of those divs to set up a new root React tree. Be sure to explicitly unmountAndReleaseReactRootNode() for each component in componentWillUnmount().

## Introduction to React Screencast

[Pete Hunt](http://www.petehunt.net/) recorded himself implementing a simple `<Blink>` tag in React.

<figure><iframe src="http://player.vimeo.com/video/67248575" width="500" height="340" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></figure>

## Snake in React

[Tom Occhino](http://tomocchino.com/) implemented Snake in 150 lines with React.

> [Check the source on Github](https://github.com/tomocchino/react-snake/blob/master/src/snake.js)
> <figure>[![](/react/img/blog/snake.png)](http://tomocchino.github.io/react-snake/)</figure>
