---
title: "React Native v0.4"
layout: post
author: [vjeux]
---

It's been three weeks since we open sourced React Native and there's been some insane amount of activity already: over 12.5k stars, 1000 commits, 500 issues, 380 pull requests, and 100 contributors, plus [35 plugins](http://react.parts/native-ios) and [1 app in the app store](http://herman.asia/building-a-flashcard-app-with-react-native)! We were expecting some buzz around the project but this is way beyond anything we imagined. Thank you!

I'd especially like to thank community members Brent Vatne and James Ide who have both already contributed meaningfully to the project and have been extremely helpful on IRC and with issues and pull requests

## Changelog

The main focus of the past few weeks has been to make React Native the best possible experience for people outside of Facebook. Here's a high level summary of what's happened since we open sourced:

* **Error messages and documentation**: We want React Native to be the absolute best developer experience for building mobile apps. We've added a lot of warnings, improved the documentation, and fixed many bugs. If you encounter anything, and I really mean anything, that is not expected or clear, please create an issue - we want to hear about it and fix it.
* **NPM modules compatibility**: There are a lot of libraries on NPM that do not depend on node/browser internals that would be really useful in React Native, such as superagent, underscore, parse, and many others.  The packager is now a lot more faithful to node/browserify/webpack dependency resolution. If your favorite library doesn't work out of the box, please open up an issue.
* **Infrastructure**: We are refactoring the internals of React Native to make it easier to plug in to existing iOS codebases, as well as improve performance by removing redundant views and shadow views, supporting multiple root views and manually registering classes to reduce startup time.
* **Components**: The API for a lot of UI components and APIs, especially the ones we're not using heavily inside of Facebook, has dramatically improved thanks to many of your pull requests.
* **Tests**: We ported JavaScript tests, iOS Snapshot tests, and End to End tests to Travis CI. We have broken GitHub master a couple of times (whoops!) when syncing and we hope that with this growing suite of tests it's going to become harder and harder to do so.
* **Patent Grant**: Many of you had concerns and questions around the PATENTS file. We pushed [a new version of the grant](https://code.facebook.com/posts/1639473982937255/updating-our-open-source-patent-grant/).
* **Per commit history**: In order to synchronize from Facebook to GitHub, we used to do one giant commit every few days. We improved our tooling and now have per commit history that maintains author information (both internal and external from pull requests), and we retroactively applied this to historical diffs to provide proper attribution.

## Where are we going?

In addition to supporting pull requests, issues, and general improvements, we're also working hard on our internal React Native integrations and on React Native for Android.
