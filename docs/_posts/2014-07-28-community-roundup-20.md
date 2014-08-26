---
title: "Community Round-up #20"
author: Lou Husson
---

It's an exciting time for React as there are now more commits from open source contributors than from Facebook engineers! Keep up the good work :)

## Atom moves to React

[Atom, GitHub's code editor, is now using React](http://blog.atom.io/2014/07/02/moving-atom-to-react.html) to build the editing experience. They made the move in order to improve performance. By default, React helped them eliminate unnecessary reflows, enabling them to focus on architecting the rendering pipeline in order to minimize repaints by using hardware acceleration. This is a testament to the fact that React's architecture is perfect for high performant applications.

[<img src="http://blog.atom.io/img/posts/gpu-cursor-move.gif" style="width: 100%;" />](http://blog.atom.io/2014/07/02/moving-atom-to-react.html)


## Why Does React Scale?

At the last [JSConf.us](http://2014.jsconf.us/), Vjeux talked about the design decisions made in the API that allows it to scale to a large number of developers. If you don't have 20 minutes, take a look at the [annotated slides](https://speakerdeck.com/vjeux/why-does-react-scale-jsconf-2014).

<iframe width="650" height="315" src="//www.youtube.com/embed/D-ioDiacTm8" frameborder="0" allowfullscreen></iframe>


## Live Editing

One of the best features of React is that it provides the foundations to implement concepts that were otherwise extremely difficult, like server-side rendering, undo-redo, rendering to non-DOM environments like canvas... [Dan Abramov](https://twitter.com/dan_abramov) got hot code reloading working with webpack in order to [live edit a React project](http://gaearon.github.io/react-hot-loader/)!

<iframe src="//player.vimeo.com/video/100010922" width="650" height="315" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


## ReactIntl Mixin by Yahoo

There are a couple of React-related projects that recently appeared on Yahoo's GitHub, the first one being an  [internationalization mixin](https://github.com/yahoo/react-intl). It's great to see them getting excited about React and contributing back to the community.

```javascript
var MyComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function() {
    return (
      <div>
        <p>{this.intlDate(1390518044403, { hour: 'numeric', minute: 'numeric' })}</p>
        <p>{this.intlNumber(400, { style: 'percent' })}</p>
      </div>
    );
  }
});

React.renderComponent(
  <MyComponent locales={['fr-FR']} />,
  document.getElementById('example')
);
```

## Thinking and Learning React

Josephine Hall, working at Icelab, used React to write a mobile-focused application. She wrote a blog post [“Thinking and Learning React.js”](http://icelab.com.au/articles/thinking-and-learning-reactjs/) to share her experience with elements they had to use. You'll learn about routing, event dispatch, touchable components, and basic animations.


## London React Meetup

If you missed the last [London React Meetup](http://www.meetup.com/London-React-User-Group/events/191406572/), the video is available, with lots of great content.

- What's new in React 0.11 and how to improve performance by guaranteeing immutability
- State handling in React with Morearty.JS
- React on Rails - How to use React with Ruby on Rails to build isomorphic apps
- Building an isomorphic, real-time to-do list with moped and node.js

<iframe width="650" height="315" src="//www.youtube.com/embed/CP3lvm5Ppqo" frameborder="0" allowfullscreen></iframe>

In related news, the next [React SF Meetup](http://www.meetup.com/ReactJS-San-Francisco/events/195518392/) will be from Prezi: [“Immediate Mode on the Web: How We Implemented the Prezi Viewer in JavaScript”](https://medium.com/prezi-engineering/how-and-why-prezi-turned-to-javascript-56e0ca57d135). While not in React, their tech is really awesome and shares a lot of React's design principles and perf optimizations.


## Using React and KendoUI Together

One of the strengths of React is that it plays nicely with other libraries. Jim Cowart proved it by writing a tutorial that explains how to write [React component adapters for KendoUI](http://www.ifandelse.com/using-reactjs-and-kendoui-together/).

<figure><a href="http://www.ifandelse.com/using-reactjs-and-kendoui-together/"><img src="/react/img/blog/kendoui.png" /></a></figure>


## Acorn JSX

Ingvar Stepanyan extended the Acorn JavaScript parser to support JSX. The result is a [JSX parser](https://github.com/RReverser/acorn-jsx) that's 1.5–2.0x faster than the official JSX implementation. It is an experiment and is not meant to be used for serious things, but it's always a good thing to get competition on performance!


## ReactScriptLoader

Yariv Sadan created [ReactScriptLoader](https://github.com/yariv/ReactScriptLoader) to make it easier to write components that require an external script.

```javascript
var Foo = React.createClass({
  mixins: [ReactScriptLoaderMixin],
  getScriptURL: function() {
    return 'http://d3js.org/d3.v3.min.js';
  },
  getInitialState: function() {
    return { scriptLoading: true, scriptLoadError: false };
  },
  onScriptLoaded: function() {
    this.setState({scriptLoading: false});
  },
  onScriptError: function() {
    this.setState({scriptLoading: false, scriptLoadError: true});
  },
  render: function() {
    var message =
      this.state.scriptLoading ? 'Loading script...' :
      this.state.scriptLoadError ? 'Loading failed' :
      'Loading succeeded';
    return <span>{message}</span>;
  }
});
```

## Random Tweet

<blockquote class="twitter-tweet" data-conversation="none" lang="en"><p>“<a href="https://twitter.com/apphacker">@apphacker</a>: I take back the mean things I said about <a href="https://twitter.com/reactjs">@reactjs</a> I actually like it.” Summarizing the life of ReactJS in a single tweet.</p>&mdash; Jordan (@jordwalke) <a href="https://twitter.com/jordwalke/statuses/490747339607265280">July 20, 2014</a></blockquote>

