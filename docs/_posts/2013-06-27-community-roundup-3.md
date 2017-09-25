---
title: "Community Round-up #3"
author: [vjeux]
---

The highlight of this week is that an interaction-heavy app has been ported to React. React components are solving issues they had with nested views.

## Moving From Backbone To React

[Clay Allsopp](https://twitter.com/clayallsopp) successfully ported [Propeller](http://usepropeller.com/blog/posts/from-backbone-to-react/), a fairly big, interaction-heavy JavaScript app, to React.

> [<img style="float: right; margin: 0 0 10px 10px;" src="../img/blog/propeller-logo.png" />](http://usepropeller.com/blog/posts/from-backbone-to-react/)Subviews involve a lot of easy-to-forget boilerplate that Backbone (by design) doesn't automate. Libraries like Backbone.Marionette offer more abstractions to make view nesting easier, but they're all limited by the fact that Backbone delegates how and went view-document attachment occurs to the application code.
>
> React, on the other hand, manages the DOM and only exposes real nodes at select points in its API. The "elements" you code in React are actually objects which wrap DOM nodes, not the actual objects which get inserted into the DOM. Internally, React converts those abstractions into actual DOMElements and fills out the document accordingly. [...]
>
> We moved about 20 different Backbone view classes to React over the past few weeks, including the live-preview pane that you see in our little iOS demo. Most importantly, it's allowed us to put energy into making each component work great on its own, instead of spending extra cycles to ensure they function in unison. For that reason, we think React is a more scalable way to build view-intensive apps than Backbone alone, and it doesn't require you to drop-everything-and-refactor like a move to Ember or Angular would demand.
>
> [Read the full post...](http://usepropeller.com/blog/posts/from-backbone-to-react/)

## Grunt Task for JSX

[Eric Clemmons](https://ericclemmons.github.io/) wrote a task for [Grunt](http://gruntjs.com/) that applies the JSX transformation to your JavaScript files. It also works with [Browserify](http://browserify.org/) if you want all your files to be concatenated and minified together.

> Grunt task for compiling Facebook React's .jsx templates into .js
>
> ```javascript
> grunt.initConfig({
>   react: {
>     app: {
>       options: { extension: 'js' },
>       files: { 'path/to/output/dir': 'path/to/jsx/templates/dir' }
> ```
>
> It also works great with `grunt-browserify`!
>
> ```javascript
> browserify: {
>   options: {
>     transform: [ require('grunt-react').browserify ]
>   },
>   app: {
>     src: 'path/to/source/main.js',
>     dest: 'path/to/target/output.js'
> ```
>
> [Check out the project ...](https://github.com/ericclemmons/grunt-react)

## Backbone/Handlebars Nested Views

[Joel Burget](http://joelburget.com/) wrote a blog post talking about the way we would write React-like components in Backbone and Handlebars.

> The problem here is that we're trying to maniplate a tree, but there's a textual layer we have to go through. Our views are represented as a tree - the subviews are children of CommentCollectionView - and they end up as part of a tree in the DOM. But there's a Handlebars layer in the middle (which deals in flat strings), so the hierarchy must be destructed and rebuilt when we render.
>
> What does it take to render a collection view? In the Backbone/Handlebars view of the world you have to render the template (with stubs), render each subview which replaces a stub, and keep a reference to each subview (or anything within the view that could change in the future).
>
> So while our view is conceptually hierarchical, due to the fact that it has to go through a flat textual representation, we need to do a lot of extra work to reassemble that structure after rendering.
>
> [Read the full post...](http://joelburget.com/react/)

## JSRomandie Meetup

[Renault John Lecoultre](https://twitter.com/renajohn/) from [BugBuster](http://www.bugbuster.com) did a React introduction talk at a JS meetup called [JS Romandie](https://twitter.com/jsromandie) last week.

<script async class="speakerdeck-embed" data-id="888a9d50c01b01300df36658d0894ac1" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

## CoffeeScript integration

[Vjeux](http://blog.vjeux.com/) used the fact that JSX is just a syntactic sugar on-top of regular JS to rewrite the React front-page examples in CoffeeScript.

> Multiple people asked what's the story about JSX and CoffeeScript. There is no JSX pre-processor for CoffeeScript and I'm not aware of anyone working on it. Fortunately, CoffeeScript is pretty expressive and we can play around the syntax to come up with something that is usable.
>
> ```javascript
> {div, h3, textarea} = React.DOM
> (div {className: 'MarkdownEditor'}, [
>   (h3 {}, 'Input'),
>   (textarea {onKeyUp: @handleKeyUp, ref: 'textarea'},
>     @state.value
>   )
> ])
> ```
>
> [Read the full post...](http://blog.vjeux.com/2013/javascript/react-coffeescript.html)

## Tutorial in Plain JavaScript

We've seen a lot of people comparing React with various frameworks. [Ricardo Tomasi](http://ricardo.cc/) decided to re-implement the tutorial without any framework, just plain JavaScript.

> Facebook & Instagram launched the React framework and an accompanying tutorial. Developer Vlad Yazhbin decided to rewrite that using AngularJS. The end result is pretty neat, but if you're like me you will not actually appreciate the HTML speaking for itself and doing all the hard work. So let's see what that looks like in plain javascript.
>
> [Read the full post...](http://ricardo.cc/2013/06/07/react-tutorial-rewritten-in-plain-javascript.html)
