---
title: "Community Round-up #26"
layout: post
author: vjeux
---

We open sourced React Native last week and the community reception blew away all our expectations! So many of you tried it, made cool stuff with it, raised many issues and even submitted pull requests to fix them! The entire team wants to say thank you!

<blockquote class="twitter-tweet" lang="en"><p><a href="https://twitter.com/hashtag/reactnative?src=hash">#reactnative</a> is like when you get a new expansion pack, and everybody is running around clueless about which NPC to talk to for the quests</p>&mdash; Ryan Florence (@ryanflorence) <a href="https://twitter.com/ryanflorence/status/581810423554543616">March 28, 2015</a></blockquote>


## When is React Native Android coming?

**Give us 6 months**. At Facebook, we strive to only open-source projects that we are using in production. While the Android backend for React Native is starting to work (see video below at 37min), it hasn't been shipped to any users yet. There's a lot of work that goes into open-sourcing a project, and we want to do it right so that you have a great experience when using it.

<iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/X6YbAKiLCLU?start=2220" frameborder="0" allowfullscreen></iframe>


## Ray Wenderlich - Property Finder

If you are getting started with React Native, you should absolutely [use this tutorial](http://www.raywenderlich.com/99473/introducing-react-native-building-apps-javascript) from Colin Eberhardt. It goes through all the steps to make a reasonably complete app.

<center>
[![](/react/img/blog/property-finder.png)](http://www.raywenderlich.com/99473/introducing-react-native-building-apps-javascript)
</center>

Colin also [blogged about his experience using React Native](http://blog.scottlogic.com/2015/03/26/react-native-retrospective.html) for a few weeks and gives his thoughts on why you would or wouldn't use it.


## The Changelog

Spencer Ahrens and I had the great pleasure to talk about React Native on [The Changelog](https://thechangelog.com/149/) podcast. It was really fun to chat for an hour, I hope that you'll enjoy listening to it. :)

<audio src="http://fdlyr.co/d/changelog/cdn.5by5.tv/audio/broadcasts/changelog/2015/changelog-149.mp3" controls="controls" style="width: 100%"></audio>


## Hacker News

Less than 24 hours after React Native was open sourced, Simarpreet Singh built an [Hacker News reader app from scratch](https://github.com/iSimar/HackerNews-React-Native). It's unbelievable how fast he was able to pull it off!

<center>
[![](/react/img/blog/hacker-news-react-native.png)](https://github.com/iSimar/HackerNews-React-Native)
</center>


## Parse + React

There's a huge ecosystem of JavaScript modules on npm and React Native was designed to work well with the ones that don't have DOM dependencies. Parse is a great example; you can `npm install parse` on your React Native project and it'll work as is. :) We still have [a](https://github.com/facebook/react-native/issues/406) [few](https://github.com/facebook/react-native/issues/370) [issues](https://github.com/facebook/react-native/issues/316) to solve; please create an issue if your favorite library doesn't work out of the box.

<center>
[![](/react/img/blog/parse-react.jpg)](http://blog.parse.com/2015/03/25/parse-and-react-shared-chemistry/)
</center>


## tcomb-form-native

Giulio Canti is the author of the [tcomb-form library](https://github.com/gcanti/tcomb-form) for React. He already [ported it to React Native](https://github.com/gcanti/tcomb-form-native) and it looks great!

<center>
[![](/react/img/blog/tcomb-react-native.png)](https://github.com/gcanti/tcomb-form-native)
</center>


## Facebook Login with React Native

One of the reason we built React Native is to be able to use all the libraries in the native ecosystem. Brent Vatne leads the way and explains [how to use Facebook Login with React Native](http://brentvatne.ca/facebook-login-with-react-native/).


## Modus Create

Jay Garcia spent a lot of time during the beta working on a NES music player with React Native. He wrote a blog post to share his experience and explains some code snippets.

<center>
[![](/react/img/blog/modus-create.gif)](http://moduscreate.com/react-native-has-landed/)
</center>


## React Native with Babel and webpack

React Native ships with a custom packager and custom ES6 transforms instead of using what the open source community settled on such as webpack and Babel. The main reason for this is performance – we couldn't get those tools to have sub-second reload time on a large codebase.

Roman Liutikov found a way to [use webpack and Babel to run on React Native](https://github.com/roman01la/react-native-babel)! In the future, we want to work with those projects to provide cleaner extension mechanisms.


## A Dynamic, Crazy, Native Mobile Future—Powered by JavaScript

Clay Allsopp wrote a post about [all the crazy things you could do with a JavaScript engine that renders native views](https://medium.com/@clayallsopp/a-dynamic-crazy-native-mobile-future-powered-by-javascript-70f2d56b1987). What about native embeds, seamless native browser, native search engine or even app generation...


## Random Tweet

We've spent a lot of efforts getting the onboarding as easy as possible and we're really happy that people noticed. We still have a lot of work to do on documentation, stay tuned!

<blockquote class="twitter-tweet" lang="en"><p>Wow. Getting started with React Native might have been the smoothest experience I’ve ever had with a new developer product.</p>&mdash; Andreas Eldh (@eldh) <a href="https://twitter.com/eldh/status/581186172094980096">March 26, 2015</a></blockquote>
