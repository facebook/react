---
title: "What's New in Create React App"
author: gaearon
---

Less than a year ago, we introduced [Create React App](/react/blog/2016/07/22/create-apps-with-no-configuration.html) as an officially supported way to create apps with zero configuration. The project has since enjoyed tremendous growth, with over 950 commits by more than 250 contributors.

Today, we are excited to announce that many features that have been in the pipeline for the last few months are finally released.

As usual with Create React App, **you can enjoy these improvements in your existing non-ejected apps by updating a single dependency** and following our [migration instructions](https://github.com/facebookincubator/create-react-app/releases/tag/v1.0.0).

Newly created apps will get these improvements automatically.

### webpack 2

>*This change was contributed by [@Timer](https://github.com/Timer) in [#1291](https://github.com/facebookincubator/create-react-app/pull/1291).*

We have upgraded to webpack 2 which has been [officially released](https://medium.com/webpack/webpack-2-and-beyond-40520af9067f) a few months ago. It is a big upgrade with many bugfixes and general improvements. We have been testing it for a while, and now consider it stable enough to recommend it to everyone.

While the Webpack configuration format has changed, Create React App users who didn't eject don't need to worry about it as we have updated the configuration on our side.

If you had to eject your app for one reason or another, Webpack provides a [configuration migration guide](https://webpack.js.org/guides/migrating/) that you can follow to update your apps. Note that with each release of Create React App, we are working to support more use cases out of the box so that you don't have to eject in the future.

The biggest notable webpack 2 feature is the ability to write and import [ES6 modules](http://2ality.com/2014/09/es6-modules-final.html) directly without compiling them to CommonJS. This shouldn’t affect how you write code since you likely already use `import` and `export` statements, but it will help catch more mistakes like missing named exports at compile time:

<img src='/react/img/blog/cra-update-exports.gif' alt='Export validation' style="max-width:100%"> 

In the future, as the ecosystem around ES6 modules matures, you can expect more improvements to your app's bundle size thanks to [tree shaking](https://webpack.js.org/guides/tree-shaking/).

### Runtime Error Overlay

>*This change was contributed by [@Timer](https://github.com/Timer) and [@nicinabox](https://github.com/nicinabox) in [#1101](https://github.com/facebookincubator/create-react-app/pull/1101), [@bvaughn](https://github.com/bvaughn) in [#2201](https://github.com/facebookincubator/create-react-app/pull/2201).*

Have you ever made a mistake in code and only realized it after the console is flooded with cryptic errors? Or worse, have you ever shipped an app with crashes in production because you accidentally missed an error in development?

To address these issues, we are introducing an overlay that pops up whenever there is an uncaught error in your application. It only appears in development, and you can dismiss it by pressing Escape. 

A GIF is worth a thousand words:
    
<img src='/react/img/blog/cra-runtime-error.gif' alt='Runtime error overlay' style="max-width:100%"> 

(Yes, it integrates with your editor!)

In the future, we plan to teach the runtime error overlay to understand more about your React app. For example, after React 16 we plan to show React component stacks in addition to the JavaScript stacks when an error is thrown.


### Progressive Web Apps by Default

>*This change was contributed by [@jeffposnick](https://github.com/jeffposnick) in [#1728](https://github.com/facebookincubator/create-react-app/pull/1728).*

Newly created projects are built as [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/) by default. This means that they employ [service workers](https://developers.google.com/web/fundamentals/getting-started/primers/service-workers) with an [offline-first caching strategy](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network) to minimize the time it takes to serve the app to the users who visit it again. You can opt out of this behavior, but we recommend it both for new and existing apps, especially if you target mobile devices.

<img src='/react/img/blog/cra-pwa.png' alt='Loading assets from service worker' style="max-width:100%"> 

New apps automatically have these features, but you can easily convert an existing project to a Progressive Web App  by following [our migration guide](https://github.com/facebookincubator/create-react-app/releases/tag/v1.0.0).

We will be adding [more documentation](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#making-a-progressive-web-app) on this topic in the coming weeks. Please feel free to [ask any questions](https://github.com/facebookincubator/create-react-app/issues/new) on the issue tracker!


### Jest 20

>*This change was contributed by [@rogeliog](https://github.com/rogeliog) in [#1614](https://github.com/facebookincubator/create-react-app/pull/1614) and [@gaearon](https://github.com/gaearon) in [#2171](https://github.com/facebookincubator/create-react-app/pull/2171).*
   
We are now using the latest version of Jest that includes numerous bugfixes and improvements. You can read more about the changes in [Jest 19](https://facebook.github.io/jest/blog/2017/02/21/jest-19-immersive-watch-mode-test-platform-improvements.html) and [Jest 20](http://facebook.github.io/jest/blog/2017/05/06/jest-20-delightful-testing-multi-project-runner.html) blog posts.

Highlights include a new [immersive watch mode](https://facebook.github.io/jest/blog/2017/02/21/jest-19-immersive-watch-mode-test-platform-improvements.html#immersive-watch-mode), [a better snapshot format](https://facebook.github.io/jest/blog/2017/02/21/jest-19-immersive-watch-mode-test-platform-improvements.html#snapshot-updates), [improvements to printing skipped tests](https://facebook.github.io/jest/blog/2017/02/21/jest-19-immersive-watch-mode-test-platform-improvements.html#improved-printing-of-skipped-tests), and [new testing APIs](https://facebook.github.io/jest/blog/2017/05/06/jest-20-delightful-testing-multi-project-runner.html#new-improved-testing-apis).

<img src='/react/img/blog/cra-jest-search.gif' alt='Immersive test watcher' style="max-width:100%"> 

Additionally, Create React App now support configuring a few Jest options related to coverage reporting.

### Code Splitting with Dynamic import()

>*This change was contributed by [@Timer](https://github.com/Timer) in [#1538](https://github.com/facebookincubator/create-react-app/pull/1538) and [@tharakawj](https://github.com/tharakawj) in [#1801](https://github.com/facebookincubator/create-react-app/pull/1801).*
   
It is important to keep the initial JavaScript payload of web apps down to the minimum, and [load the rest of the code on demand](https://medium.com/@addyosmani/progressive-web-apps-with-react-js-part-2-page-load-performance-33b932d97cf2). Although Create React App supported [code splitting](https://webpack.js.org/guides/code-splitting-async/) using `require.ensure()` since the first release, it used a webpack-specific syntax that did not work in Jest or other environments.
   
In this release, we are adding support for the [dynamic `import()` proposal](http://2ality.com/2017/01/import-operator.html#loading-code-on-demand) which aligns with the future web standards. Unlike `require.ensure()`, it doesn't break Jest tests, and should eventually become a part of JavaScript. We encourage you to use `import()` to delay loading the code for non-critical component subtrees until you need to render them.

<img src='/react/img/blog/cra-dynamic-import.gif' alt='Creating chunks with dynamic import' style="max-width:100%">

### Better Console Output

>*This change was contributed by [@gaearon](https://github.com/gaearon) in [#2120](https://github.com/facebookincubator/create-react-app/pull/2120), [#2125](https://github.com/facebookincubator/create-react-app/pull/2125), and [#2161](https://github.com/facebookincubator/create-react-app/pull/2161).*

We have improved the console output across the board.

For example, when you start the development server, we now display the LAN address in additional to the localhost address so that you can quickly access the app from a mobile device on the same network:

<img src='/react/img/blog/cra-better-output.png' alt='Better console output' style="max-width:100%"> 

When lint errors are reported, we no longer show the warnings so that you can concentrate on more critical issues. Errors and warnings in the production build output are better formatted, and the build error overlay font size now matches the browser font size more closely.

### But Wait... There's More!

You can only fit so much in a blog post, but there are other long-requested features in this release, such as [environment-specific and local `.env` files](https://github.com/facebookincubator/create-react-app/pull/1344), [a lint rule against confusingly named globals](https://github.com/facebookincubator/create-react-app/pull/2130), [support for multiple proxies in development](https://github.com/facebookincubator/create-react-app/pull/1790), [a customizable browser launch script](https://github.com/facebookincubator/create-react-app/pull/1590), and many bugfixes.

You can read the full changelog and the migration guide in the [v1.0.0 release notes](https://github.com/facebookincubator/create-react-app/releases/tag/v1.0.0).

### Acknowledgements

This release is a result of months of work from many people in the React community. It is focused on improving both developer and end user experience, as we believe they are complementary and go hand in hand.

We are grateful to [everyone who has offered their contributions](https://github.com/facebookincubator/create-react-app/graphs/contributors), whether in code, documentation, or by helping other people. We would like to specifically thank [Joe Haddad](https://github.com/timer) for his invaluable help maintaining the project.

We are excited to bring these improvements to everybody using Create React App, and we are looking forward to more of your feedback and contributions.

