---
id: how-to-contribute
title: How to Contribute
layout: contributing
permalink: contributing/how-to-contribute.html
next: codebase-overview.html
redirect_from: "tips/introduction.html"
---

React is one of Facebook's first open source projects that is both under very active development and is also being used to ship code to everybody on [facebook.com](https://www.facebook.com). We're still working out the kinks to make contributing to this project as easy and transparent as possible, but we're not quite there yet. Hopefully this document makes the process for contributing clear and answers some questions that you may have.

### [Code of Conduct](https://code.facebook.com/codeofconduct)

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.facebook.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

### Open Development

All work on React happens directly on [GitHub](https://github.com/facebook/react). Both core team members and external contributors send pull requests which go through the same review process.

### Branch Organization

We will do our best to keep the [`master` branch](https://github.com/facebook/react/tree/master) in good shape, with tests passing at all times. But in order to move fast, we will make API changes that your application might not be compatible with. We recommend that you use [the latest stable version of React](/react/downloads.html).

If you send a pull request, please do it against the `master` branch. We maintain stable branches for major versions separately but we don't accept pull requests to them directly. Instead, we cherry-pick non-breaking changes from master to the latest stable major version.

### Semantic Versioning

React follows [semantic versioning](http://semver.org/). We release patch versions for bugfixes, minor versions for new features, and major versions for any breaking changes. When we make breaking changes, we also introduce deprecation warnings in a minor version so that our users learn about the upcoming changes and migrate their code in advance.

We tag every pull request with a label marking whether the change should go in the next [patch](https://github.com/facebook/react/pulls?q=is%3Aopen+is%3Apr+label%3Asemver-patch), [minor](https://github.com/facebook/react/pulls?q=is%3Aopen+is%3Apr+label%3Asemver-minor), or a [major](https://github.com/facebook/react/pulls?q=is%3Aopen+is%3Apr+label%3Asemver-major) version. We release new patch versions every few weeks, minor versions every few months, and major versions one or two times a year.

Every significant change is documented in the [changelog file](https://github.com/facebook/react/blob/master/CHANGELOG.md).

### Bugs

#### Where to Find Known Issues

We are using [GitHub Issues](https://github.com/facebook/react/issues) for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

#### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case. This [JSFiddle template](https://jsfiddle.net/84v837e9/) is a great starting point.

#### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. With that in mind, please do not file public issues; go through the process outlined on that page.

### How to Get in Touch

* IRC: [#reactjs on freenode](https://webchat.freenode.net/?channels=reactjs)
* Discussion forum: [discuss.reactjs.org](https://discuss.reactjs.org/)

There is also [an active community of React users on the Discord chat platform](http://www.reactiflux.com/) in case you need help with React.

### Proposing a Change

If you intend to change the public API, or make any non-trivial changes to the implementation, we recommend [filing an issue](https://github.com/facebook/react/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

### Your First Pull Request

Working on your first Pull Request? You can learn how from this free video series:

**[How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)**

To help you get your feet wet and get you familiar with our contribution process, we have a list of **[beginner friendly issues](https://github.com/facebook/react/issues?q=is%3Aopen+is%3Aissue+label%3A%22Difficulty%3A+beginner%22)** that contain bugs which are fairly easy to fix. This is a great place to get started.

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment stating that you intend to work on it so other people don't accidentally duplicate your effort.

If somebody claims an issue but doesn't follow up for more than two weeks, it's fine to take over it but you should still leave a comment.

### Sending a Pull Request

The core team is monitoring for pull requests. We will review your pull request and either merge it, request changes to it, or close it with an explanation. For API changes we may need to fix our internal uses at Facebook.com, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.

**Before submitting a pull request,** please make sure the following is done:

1. Fork [the repository](https://github.com/facebook/react) and create your branch from `master`.
2. If you've added code that should be tested, add tests!
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test`).
5. Format your code with [prettier](https://github.com/prettier/prettier) (`npm run prettier`).
6. Make sure your code lints (`npm run lint`).
7. Run the [Flow](https://flowtype.org/) typechecks (`npm run flow`).
8. If you added or removed any tests, run `./scripts/fiber/record-tests` before submitting the pull request, and commit the resulting changes. You can see the full output of fiber tests with `REACT_DOM_JEST_USE_FIBER=1 npm test`.
9. If you haven't already, complete the CLA.

### Contributor License Agreement (CLA)

In order to accept your pull request, we need you to submit a CLA. You only need to do this once, so if you've done this for another Facebook open source project, you're good to go. If you are submitting a pull request for the first time, just let us know that you have completed the CLA and we can cross-check with your GitHub username.

**[Complete your CLA here.](https://code.facebook.com/cla)**

### Contribution Prerequisites

* You have `node` installed at v4.0.0+ and `npm` at v2.0.0+.
* You have `gcc` installed or are comfortable installing a compiler if needed. Some of our `npm` dependencies may require a compilation step. On OS X, the Xcode Command Line Tools will cover this. On Ubuntu, `apt-get install build-essential` will install the required packages. Similar commands should work on other Linux distros. Windows will require some additional steps, see the [`node-gyp` installation instructions](https://github.com/nodejs/node-gyp#installation) for details.
* You are familiar with `npm` and know whether or not you need to use `sudo` when installing packages globally.
* You are familiar with `git`.

### Development Workflow

After cloning React, run `npm install` to fetch its dependencies.
Then, you can run several commands:

* `npm run lint` checks the code style.
* `npm test` runs the complete test suite.
* `npm test -- --watch` runs an interactive test watcher.
* `npm test <pattern>` runs tests with matching filenames.
* `npm run flow` runs the [Flow](https://flowtype.org/) typechecks.
* `npm run build` creates a `build` folder with all the packages.

We recommend running `npm test` (or its variations above) to make sure you don't introduce any regressions as you work on your change. However it can be handy to try your build of React in a real project.

First, run `npm run build`. This will produce pre-built bundles in `build` folder, as well as prepare npm packages inside `build/packages`.

The easiest way to try your changes is to run `npm run build` and then open `fixtures/packaging/babel-standalone/dev.html`. This file already uses `react.js` from the `build` folder so it will pick up your changes.

If you want to try your changes in your existing React project, you may copy `build/dist/react.development.js`, `build/dist/react-dom.development.js`, or any other build products into your app and use them instead of the stable version. If your project uses React from npm, you may delete `react` and `react-dom` in its dependencies and use `npm link` to point them to your local `build` folder:

```sh
cd your_project
npm link ~/path_to_your_react_clone/build/packages/react
npm link ~/path_to_your_react_clone/build/packages/react-dom
```

Every time you run `npm run build` in the React folder, the updated versions will appear in your project's `node_modules`. You can then rebuild your project to try your changes.

We still require that your pull request contains unit tests for any new functionality. This way we can ensure that we don't break your code in the future.

### Style Guide

Our linter will catch most styling issues that may exist in your code.
You can check the status of your code styling by simply running `npm run lint`.

However, there are still some styles that the linter cannot pick up. If you are unsure about something, looking at [Airbnb's Style Guide](https://github.com/airbnb/javascript) will guide you in the right direction.

### Code Conventions

* Use semicolons `;`
* Commas last `,`
* 2 spaces for indentation (no tabs)
* Prefer `'` over `"`
* `'use strict';`
* 120 character line length (**except documentation**)
* Write "attractive" code
* Do not use the optional parameters of `setTimeout` and `setInterval`

### Introductory Video

You may be interested in watching [this short video](https://www.youtube.com/watch?v=wUpPsEcGsg8) (26 mins) which gives an introduction on how to contribute to React.

### Meeting Notes

React team meets once a week to discuss the development of React, future plans, and priorities. You can find the meeting notes in a [dedicated repository](https://github.com/reactjs/core-notes/).

### License

By contributing to React, you agree that your contributions will be licensed under its BSD license.

### What Next?

Read the [next section](/react/contributing/codebase-overview.html) to learn how the codebase is organized.
