---
title: "Community Round-up #9"
author: Vjeux
---

We organized a React hackathon last week-end in the Facebook Seattle office. 50 people, grouped into 15 teams, came to hack for a day on React. It was a lot of fun and we'll probably organize more in the future.

![](/react/img/blog/react-hackathon.jpg)


## React Hackathon Winner

[Alex Swan](http://bold-it.com/) implemented [Qu.izti.me](http://qu.izti.me/), a multi-player quiz game. It is real-time via Web Socket and mobile friendly.

> The game itself is pretty simple. People join the "room" by going to [http://qu.izti.me](http://qu.izti.me/) on their device. Large displays will show a leaderboard along with the game, and small displays (such as phones) will act as personal gamepads. Users will see questions and a choice of answers. The faster you answer, the more points you earn.
>
> In my opinion, Socket.io and React go together like chocolate and peanut butter. The page was always an accurate representation of the game object.
><figure>[![](/react/img/blog/quiztime.png)](http://bold-it.com/javascript/facebook-react-example/)</figure>
>
> [Read More...](http://bold-it.com/javascript/facebook-react-example/)

## JSConf EU Talk: Rethinking Best Practices

[Pete Hunt](http://www.petehunt.net/) presented React at JSConf EU. He covers three controversial design decisions of React:

1. Build **components**, not templates
2. Re-render the whole app on every update
3. Virtual DOM

The video will be available soon on the [JSConf EU website](http://2013.jsconf.eu/speakers/pete-hunt-react-rethinking-best-practices.html), but in the meantime, here are Pete's slides:

<figure><iframe src="http://www.slideshare.net/slideshow/embed_code/26589373" width="550" height="450" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe></figure>


## Pump - Clojure bindings for React

[Alexander Solovyov](http://solovyov.net/) has been working on React bindings for ClojureScript. This is really exciting as it is using "native" ClojureScript data structures.

```ruby
(ns your.app
  (:require-macros [pump.def-macros :refer [defr]])
  (:require [pump.core]))

(defr Component
  :get-initial-state #(identity {:some-value ""})

  [component props state]

  [:div {:class-name "test"} "hello"])
```

[Check it out on GitHub...](https://github.com/piranha/pump)


## JSXHint

[Todd Kennedy](http://blog.selfassembled.org/) working at [Cond&eacute; Nast](http://www.condenast.com/) implemented a wrapper on-top of [JSHint](http://www.jshint.com/) that first converts JSX files to JS.

> A wrapper around JSHint to allow linting of files containg JSX syntax. Accepts glob patterns. Respects your local .jshintrc file and .gitignore to filter your glob patterns.
>
> ```
npm install -g jsxhint
```
>
> [Check it out on GitHub...](https://github.com/CondeNast/JSXHint)


## Turbo React

[Ross Allen](https://twitter.com/ssorallen) working at [Mesosphere](http://mesosphere.io/) combined [Turbolinks](https://github.com/rails/turbolinks/), a library used by Ruby on Rails to speed up page transition, and React.

> "Re-request this page" is just a link to the current page. When you click it, Turbolinks intercepts the GET request and fetchs the full page via XHR.
>
> The panel is rendered with a random panel- class on each request, and the progress bar gets a random widthX class.
>
> With Turbolinks alone, the entire <body> would be replaced, and transitions would not happen. In this little demo though, React adds and removes classes and text, and the attribute changes are animated with CSS transitions. The DOM is otherwise left intact.
><figure>[![](/react/img/blog/turboreact.png)](https://turbo-react.herokuapp.com/)</figure>
>
> [Check out the demo...](https://turbo-react.herokuapp.com/)


## Reactive Table

[Stoyan Stefanov](http://www.phpied.com/) continues his series of blog posts about React. This one is an introduction tutorial on rendering a simple table with React.

> React is all about components. So let's build one.
>
> Let's call it Table (to avoid any confusion what the component is about).
>
> ```javascript
var Table = React.createClass({
  /*stuff goeth here*/
});
```
>
> You see that React components are defined using a regular JS object. Some properties and methods of the object such as render() have special meanings, the rest is upforgrabs.
>
> [Read the full article...](http://www.phpied.com/reactive-table/)

