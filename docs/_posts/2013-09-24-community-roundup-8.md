---
title: "Community Round-up #8"
author: vjeux
---

A lot has happened in the month since our last update. Here are some of the more interesting things we've found. But first, we have a couple updates before we share links.

First, we are organizing a [React Hackathon](http://reactjshack-a-thon.splashthat.com/) in Facebook's Seattle office on Saturday September 28. If you want to hack on React, meet some of the team or win some prizes, feel free to join us!

We've also reached a point where there are too many questions for us to handle directly. We're encouraging people to ask questions on [StackOverflow](http://stackoverflow.com/questions/tagged/reactjs) using the tag [[reactjs]](http://stackoverflow.com/questions/tagged/reactjs). Many members of the team and community have subscribed to the tag, so feel free to ask questions there. We think these will be more discoverable than Google Groups archives or IRC logs.

## Javascript Jabber

[Pete Hunt](http://www.petehunt.net/) and [Jordan Walke](https://github.com/jordwalke) were interviewed on [Javascript Jabber](http://javascriptjabber.com/073-jsj-react-with-pete-hunt-and-jordan-walke/) for an hour.  They go over many aspects of React such as 60 FPS, Data binding, Performance, Diffing Algorithm, DOM Manipulation, Node.js support, server-side rendering, JSX, requestAnimationFrame and the community. This is a gold mine of information about React.

> **PETE:**  So React was designed all around that. Conceptually, how you build a React app is that every time your data changes, it's like hitting the refresh button in a server-rendered app. What we do is we conceptually throw out all of the markup and event handlers that you've registered and we reset the whole page and then we redraw the entire page. If you're writing a server-rendered app, handling updates is really easy because you hit the refresh button and you're pretty much guaranteed to get what you expect.
>
> **MERRICK:**  That's true. You don't get into these odd states.
>
> **PETE:**  Exactly, exactly. In order to implement that, we communicate it as a fake DOM. What we'll do is rather than throw out the actual browser html and event handlers, we have an internal representation of what the page looks like and then we generate a brand new representation of what we want the page to look like. Then we perform this really, really fast diffing algorithm between those two page representations, DOM representations. Then React will compute the minimum set of DOM mutations it needs to make to bring the page up to date.
>
> Then to finally get to answer your question, that set of DOM mutations then goes into a queue and we can plug in arbitrary flushing strategies for that. For example, when we originally launched React in open source, every setState would immediately trigger a flush to the DOM. That wasn't part of the contract of setState, but that was just our strategy and it worked pretty well. Then this totally awesome open source contributor Ben Alpert at Khan Academy built a new batching strategy which would basically queue up every single DOM update and state change that happened within an event tick and would execute them in bulk at the end of the event tick.
>
> [Read the full conversation ...](http://javascriptjabber.com/073-jsj-react-with-pete-hunt-and-jordan-walke/)


## JSXTransformer Trick

While this is not going to work for all the attributes since they are camelCased in React, this is a pretty cool trick.

<div style="margin-left: 74px;"><blockquote class="twitter-tweet"><p>Turn any DOM element into a React.js function: JSXTransformer.transform(&quot;/** <a href="https://twitter.com/jsx">@jsx</a> React.DOM */&quot; + element.innerHTML).code</p>&mdash; Ross Allen (@ssorallen) <a href="https://twitter.com/ssorallen/statuses/377105575441489920">September 9, 2013</a></blockquote></div>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>


## Remarkable React

[Stoyan Stefanov](http://www.phpied.com/) gave a talk at [BrazilJS](http://braziljs.com.br/) about React and wrote an article with the content of the presentation. He goes through the difficulties of writting _active apps_ using the DOM API and shows how React handles it.

> So how does exactly React deal with it internally? Two crazy ideas - virtual DOM and synthetic events.
>
> You define you components in React. It builds a virtual DOM in JavaScript land which is way more efficient. Then it updates the DOM. (And "virtual DOM" is a very big name for what is simply a JavaScript object with nested key-value pairs)
>
> Data changes. React computes a diff (in JavaScript land, which is, of course, much more efficient) and updates the single table cell that needs to change. React replicates the state of the virtual DOM into the actual DOM only when and where it's necessary. And does it all at once, in most cases in a single tick of the `requestAnimationFrame()`.
>
> What about event handlers? They are synthetic. React uses event delegation to listen way at the top of the React tree. So removing a node in the virtual DOM has no effect on the event handling.
>
> The events are automatically cross-browser (they are React events). They are also much closer to W3C than any browser. That means that for example `e.target` works, no need to look for the event object or checking whether it's `e.target` or `e.srcElement` (IE). Bubbling and capturing phases also work cross browser. React also takes the liberty of making some small fixes, e.g. the event `<input onChange>` fires when you type, not when blur away from the input. And of course, event delegation is used as the most efficient way to handle events. You know that "thou shall use event delegation" is also commonly given advice for making web apps snappy.
>
> The good thing about the virtual DOM is that it's all in JavaScript land. You build all your UI in JavaScript. Which means it can be rendered on the server side, so you initial view is fast (and any SEO concerns are addressed). Also, if there are especially heavy operations they can be threaded into WebWorkers, which otherwise have no DOM access.
>
> [Read More ...](http://www.phpied.com/remarkable-react/)


## Markdown in React

[Ben Alpert](http://benalpert.com/) converted [marked](https://github.com/chjj/marked), a Markdown Javascript implementation, in React: [marked-react](https://github.com/spicyj/marked-react). Even without using JSX, the HTML generation is now a lot cleaner. It is also safer as forgetting a call to `escape` will not introduce an XSS vulnerability.
<figure>[![](/react/img/blog/markdown_refactor.png)](https://github.com/spicyj/marked-react/commit/cb70c9df6542c7c34ede9efe16f9b6580692a457)</figure>


## Unite from BugBusters

[Renault John Lecoultre](https://twitter.com/renajohn) wrote [Unite](https://www.bugbuster.com/), an interactive tool for analyzing code dynamically using React. It integrates with CodeMirror.
<figure>[![](/react/img/blog/unite.png)](https://unite.bugbuster.com/)</figure>

## #reactjs IRC Logs

[Vjeux](http://blog.vjeux.com/) re-implemented the display part of the IRC logger in React. Just 130 lines are needed for a performant infinite scroll with timestamps and color-coded author names.

[View the source on JSFiddle...](http://jsfiddle.net/vjeux/QL9tz)
