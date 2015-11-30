---
title: "Community Round-up #14"
author: vjeux
---

The theme of this first round-up of 2014 is integration. I've tried to assemble a list of articles and projects that use React in various environments.

## React Baseline

React is only one-piece of your web application stack. [Mark Lussier](https://github.com/intabulas) shared his baseline stack that uses React along with Grunt, Browserify, Bower, Zepto, Director and Sass. This should help you get started using React for a new project.

> As I do more projects with ReactJS I started to extract a baseline to use when starting new projects. This is very opinionated and I change my opinion from time to time. This is by no ways perfect and in your opinion most likely wrong :).. which is why I love github
>
> I encourage you to fork, and make it right and submit a pull request!
>
> My current opinion is using tools like Grunt, Browserify, Bower and mutiple grunt plugins to get the job done. I also opted for Zepto over jQuery and the Flatiron Project's Director when I need a router. Oh and for the last little bit of tech that makes you mad, I am in the SASS camp when it comes to stylesheets
>
> [Check it out on GitHub...](https://github.com/intabulas/reactjs-baseline)


## Animal Sounds

[Josh Duck](http://joshduck.com/) used React in order to build a Windows 8 tablet app. This is a good example of a touch app written in React.
<figure>[![](/react/img/blog/animal-sounds.jpg)](http://apps.microsoft.com/windows/en-us/app/baby-play-animal-sounds/9280825c-2ed9-41c0-ba38-aa9a5b890bb9)</figure>

[Download the app...](http://apps.microsoft.com/windows/en-us/app/baby-play-animal-sounds/9280825c-2ed9-41c0-ba38-aa9a5b890bb9)


## React Rails Tutorial

[Selem Delul](http://selem.im) bundled the [React Tutorial](/react/docs/tutorial.html) into a rails app. This is a good example on how to get started with a rails project.

> ```
git clone https://github.com/necrodome/react-rails-tutorial
cd react-rails-tutorial
bundle install
rake db:migrate
rails s
```
> Then visit http://localhost:3000/app to see the React application that is explained in the React Tutorial. Try opening multiple tabs!
>
> [View on GitHub...](https://github.com/necrodome/react-rails-tutorial)

## Mixing with Backbone

[Eldar Djafarov](http://eldar.djafarov.com/) implemented a mixin to link Backbone models to React state and a small abstraction to write two-way binding on-top.

[View code on JSFiddle](http://jsfiddle.net/djkojb/qZf48/13/)

[Check out the blog post...](http://eldar.djafarov.com/2013/11/reactjs-mixing-with-backbone/)


## React Infinite Scroll

[Guillaume Rivals](https://twitter.com/guillaumervls) implemented an InfiniteScroll component. This is a good example of a React component that has a simple yet powerful API.

```javascript
<InfiniteScroll
  pageStart={0}
  loadMore={loadFunc}
  hasMore={true || false}
  loader={<div className="loader">Loading ...</div>}>
  {items} // <-- This is the "stuff" you want to load
</InfiniteScroll>
```

[Try it out on GitHub!](https://github.com/guillaumervls/react-infinite-scroll)


## Web Components Style

[Thomas Aylott](http://subtlegradient.com/) implemented an API that looks like Web Components but using React underneath.

[View the source on JSFiddle...](http://jsfiddle.net/SubtleGradient/ue2Aa)

## React vs Angular

React is often compared with Angular. [Pete Hunt](http://skulbuny.com/2013/10/31/react-vs-angular/) wrote an opinionated post on the subject.

> First of all I think it’s important to evaluate technologies on objective rather than subjective features. “It feels nicer” or “it’s cleaner” aren’t valid reasons: performance, modularity, community size and ease of testing / integration with other tools are.
>
> I’ve done a lot of work benchmarking, building apps, and reading the code of Angular to try to come up with a reasonable comparison between their ways of doing things.
>
> [Read the full post...](http://skulbuny.com/2013/10/31/react-vs-angular/)



## Random Tweet

<div><blockquote class="twitter-tweet" lang="en"><p>Really intrigued by React.js. I&#39;ve looked at all JS frameworks, and excepting <a href="https://twitter.com/serenadejs">@serenadejs</a> this is the first one which makes sense to me.</p>&mdash; Jonas Nicklas (@jonicklas) <a href="https://twitter.com/jonicklas/statuses/412640708755869696">December 16, 2013</a></blockquote></div>
