---
title: "Community Round-up #24"
layout: post
author: Steven Luscher
---

## Keep it Simple

Pedro Nauck ([pedronauck](https://github.com/pedronauck)) delivered an impeccably illustrated deck at Brazil's _Front in Floripa_ conference. Watch him talk about how to keep delivering value as your app scales, by keeping your development process simple.

<script async class="speakerdeck-embed" data-id="44129b9054c901328b89221e99b278fe" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

Murilo Pereira ([mpereira](https://github.com/mpereira)) tussles with the topic of complexity in this blog post about [coping with scaling up](http://www.techsonian.net/2014/09/from-backbone-to-react-our-experience-scaling-a-web-application/), where he describes how his team used React to make possible the “nearly impossible.”

I ([steveluscher](https://github.com/steveluscher)) spoke at Manning Publications' “Powered By JavaScript” Strangeloop pre-conf in St. Louis. There, I proposed a new notation to talk about development complexity – Big-Coffee Notation ☕(n) – and spoke about the features of React that help keep our Big-Coffee from going quadratic, as our user interfaces get more complex.

<iframe width="560" height="315" src="//www.youtube.com/embed/rI0GQc__0SM" frameborder="0" allowfullscreen></iframe>

James Pearce ([jamesgpearce](https://github.com/jamesgpearce)) carried Big-Coffee all the way to Raleigh, NC. At the _All Things Open_ conference, he spoke about some of the design decisions that went into React, particularly those that lend themselves to simpler, more reliable code.

<iframe width="560" height="315" src="//www.youtube.com/embed/m2fuO2wl_3c" frameborder="0" allowfullscreen></iframe>

## All About Isomorphism

Michael Ridgway ([mridgway](https://github.com/mridgway)) shows us how Yahoo! (who recently [moved Yahoo! Mail to React](http://www.slideshare.net/rmsguhan/react-meetup-mailonreact)) renders their React+Flux application, server-side.

<script async class="speakerdeck-embed" data-id="87ecaa3048750132f42542ffc18c6fcf" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

Péter Márton ([hekike](https://github.com/hekike)) helps us brew a cold one (literally) using an application that's server-client [isomorphic and indexable](http://blog.risingstack.com/from-angularjs-to-react-the-isomorphic-way/). Demo and sample code included – cold ones sold separately.

And, lest you think that client-server isomorphism exists in pursuit of crawalable, indexable HTML alone, watch as Nate Hunzaker ([nhunzaker](https://github.com/nhunzaker)) [server renders data visualizations as SVG](http://viget.com/extend/visualization-is-for-sharing-using-react-for-portable-data-visualization) with React.

## React Router Mows the Lawn

Ryan Florence ([rpflorence](https://github.com/rpflorence])) and Michael Jackson ([mjackson](https://github.com/mjackson)) unveiled a new API for [React Router](https://github.com/rackt/react-router) that solves some of its user's problems by eliminating the problems themselves. Read all about what React Router learned from its community of users, and how they've [rolled your ideas into their latest release](https://github.com/rackt/react-router/wiki/Announcements).

## React in Practice

Jonathan Beebe ([somethingkindawierd](https://github.com/somethingkindawierd)) spoke about how he uses React to build tools that deliver hope to those trying to make the best of a bad situation. Watch his talk from this year's _Nodevember_ conference in Nashville

<iframe width="420" height="315" src="//www.youtube.com/embed/uZgAq1CZ1N8" frameborder="0" allowfullscreen></iframe>

If you take a peek under the covers, you'll find that React powers [Carousel](https://blog.carousel.com/2014/11/introducing-carousel-for-web-ipad-and-android-tablet/), Dropbox's new photo and video gallery app.

We enjoyed a cinematic/narrative experience with this React-powered, interactive story by British author William Boyd. Dive into “[The Vanishing Game](https://thevanishinggame.wellstoried.com)” and see for yourself.

## Be Kind, Rewind

Spend the next 60 seconds watching Daniel Woelfel ([dwwoelfel](https://github.com/dwwoelfel)) serialize a React app's state as a string, then deserialize it to produce a working UI. Read about how he uses this technique to [reproduce bugs](http://blog.circleci.com/local-state-global-concerns/) reported to him by his users.

<iframe width="420" height="315" src="//www.youtube.com/embed/5yHFTN-_mOo" frameborder="0" allowfullscreen></iframe>

## Community Components

Tom Chen ([tomchentw](https://github.com/tomchentw)) brings us a [react-google-maps](http://tomchentw.github.io/react-google-maps/) component, and a way to syntax highlight source code using Prism and the [react-prism](http://tomchentw.github.io/react-prism/) component, for good measure.

Jed Watson ([jedwatson](https://github.com/JedWatson)) helps you manage touch, tap, and press events using the [react-tappable](https://github.com/JedWatson/react-tappable) component.

To find these, and more community-built components, consult the [React Components](http://react-components.com/) and [React Rocks](http://react.rocks) component directories. React Rocks recently exceeded one-hundred listed components and counting. See one missing? Add the keyword `react-component` to your `package.json` to get listed on React Components, and [submit a link to React Rocks](https://docs.google.com/forms/d/1TpnwJmLcmmGj-_TI68upu_bKBViYeiKx7Aj9uKmV6wY/viewform).

## Waiter, There's a CSS In My JavaScript

The internet is abuzz with talk of styling React components using JavaScript instead of CSS. Christopher Chedeau ([vjeux](https://github.com/vjeux)) talks about some of the [fundamental style management challenges](https://speakerdeck.com/vjeux/react-css-in-js) we grapple with, at Facebook scale. A number of implementations of JavaScript centric style management solutions have appeared in the wild, including the React-focused [react-style](https://github.com/js-next/react-style).

## Test Isolation

Yahoo! shows us how they make use of `iframe` elements to [unit test React components in isolation](http://yahooeng.tumblr.com/post/102274727496/to-testutil-or-not-to-testutil).

## You've Got The Hang of Flux, Now Let's Flow

Facebook Open Source released [Flow](https://code.facebook.com/posts/1505962329687926/flow-a-new-static-type-checker-for-javascript/) this month – a static type checker for JavaScript. Naturally, Flow supports JSX, and you can use it to [type check React applications](https://code.facebook.com/posts/1505962329687926/flow-a-new-static-type-checker-for-javascript/#compatibility). There's never been a better reason to start making use of `propTypes` in your component specifications!

## Countdown to React.js Conf 2014

We're counting down the days until [React.js Conf](http://conf.reactjs.com) at Facebook's headquarters in Menlo Park, California, on January 28th & 29th, 2015. Thank you, to everyone who responded to the Call for Presenters. Mark the dates; tickets go on sale in three waves: at noon PST on November 28th, December 5th, and December 12th, 2014.

## React Meetups Around the World

<blockquote class="twitter-tweet" lang="en"><p>React JS meetup having pretty good turn up rate today <a href="https://twitter.com/hashtag/londonreact?src=hash">#londonreact</a> <a href="http://t.co/c360dlVVAe">pic.twitter.com/c360dlVVAe</a></p>&mdash; Alexander Savin (@karismafilms) <a href="https://twitter.com/karismafilms/status/535152580377468928">November 19, 2014</a></blockquote>

<div class="skinny-row">
  <div class="skinny-col">
    <blockquote class="twitter-tweet" lang="en"><p>60+ attendees at the second React.js Utah meetup. <a href="https://twitter.com/ryanflorence">@ryanflorence</a> doing a great job, even without the internet. <a href="http://t.co/fV59AQTOyu">pic.twitter.com/fV59AQTOyu</a></p>&mdash; ReactJS Utah (@reactjsutah) <a href="https://twitter.com/reactjsutah/status/527259410020573184">October 29, 2014</a></blockquote>
  </div>
  <div class="skinny-col">
    <blockquote class="twitter-tweet" lang="en"><p><a href="https://twitter.com/hashtag/ReactJS?src=hash">#ReactJS</a> meetup at <a href="https://twitter.com/Yahoo">@Yahoo</a> ! History of <a href="https://twitter.com/yahoomail">@yahoomail</a> and why we chose react and NodeJS <a href="http://t.co/Nm4EdTv45G">pic.twitter.com/Nm4EdTv45G</a></p>&mdash; rmsguhan (@rmsguhan) <a href="https://twitter.com/rmsguhan/status/515370950427029504">September 26, 2014</a></blockquote>
  </div>
</div>

<div class="skinny-row">
  <div class="skinny-col">
    <blockquote class="twitter-tweet" data-cards="hidden" lang="en"><p>The very first ReactJS meetup in NYC tonight, I&#39;ll be speaking about the big ideas behind Om <a href="http://t.co/dvPrFqE9eP">http://t.co/dvPrFqE9eP</a></p>&mdash; David Nolen (@swannodette) <a href="https://twitter.com/swannodette/status/532190993463128064">November 11, 2014</a></blockquote>
  </div>
  <div class="skinny-col">
    <blockquote class="twitter-tweet" lang="en"><p>If anyone in Sydney is curious about <a href="https://twitter.com/reactjs">@reactjs</a>, I&#39;m presenting at <a href="https://twitter.com/sydjs">@sydjs</a> tonight on how to use it and why it is the future. <a href="https://twitter.com/hashtag/javascript?src=hash">#javascript</a></p>&mdash; Jed Watson (@JedWatson) <a href="https://twitter.com/JedWatson/status/534943557568565248">November 19, 2014</a></blockquote>
  </div>
</div>

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
