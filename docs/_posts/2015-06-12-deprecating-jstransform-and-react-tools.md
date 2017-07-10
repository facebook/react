---
title: "Deprecating JSTransform and react-tools"
author: [zpao]
---

Today we're announcing the deprecation of react-tools and JSTransform.

As many people have noticed already, React and React Native have both switched their respective build systems to make use of [Babel](http://babeljs.io/). This replaced [JSTransform](https://github.com/facebook/jstransform), the source transformation tool that we wrote at Facebook. JSTransform has been really good for us over the past several years, however as the JavaScript language continues to evolve, the architecture we used has begun to show its age. We've faced maintenance issues and lagged behind implementing new language features. Last year, Babel (previously 6to5) exploded onto the scene, implementing new features at an amazing pace. Since then it has evolved a solid plugin API, and implemented some of our non-standard language features (JSX and Flow type annotations).

react-tools has always been a very thin wrapper around JSTransform. It has served as a great tool for the community to get up and running, but at this point we're ready to [let it go](https://www.youtube.com/watch?v=moSFlvxnbgk). We won't ship a new version for v0.14.

## Migrating to Babel

Many people in the React and broader JavaScript community have already adopted Babel. It has [integrations with a number of tools](http://babeljs.io/docs/setup/). Depending on your tool, you'll want to read up on the instructions.

We've been working with the Babel team as we started making use of it and we're confident that it will be the right tool to use with React.

## Other Deprecations

### esprima-fb

As a result of no longer maintaining JSTransform, we no longer have a need to maintain our Esprima fork ([esprima-fb](https://github.com/facebook/esprima/)). The upstream Esprima and other esprima-based forks, like Espree, have been doing an excellent job of supporting new language features recently. If you have a need of an esprima-based parser, we encourage you to look into using one of those.

Alternatively, if you need to parse JSX, take a look at [acorn](https://github.com/marijnh/acorn) parser in combination with [acorn-jsx](https://github.com/RReverser/acorn-jsx) plugin which is used inside of Babel and thus always supports the latest syntax.

### JSXTransformer
JSXTransformer is another tool we built specifically for consuming JSX in the browser. It was always intended as a quick way to prototype code before setting up a build process. It would look for `<script>` tags with `type="text/jsx"` and then transform and run. This ran the same code that react-tools ran on the server. Babel ships with [a nearly identical tool](https://babeljs.io/docs/usage/browser/), which has already been integrated into [JS Bin](https://jsbin.com/).

We'll be deprecating JSXTransformer, however the current version will still be available from various CDNs and Bower.
