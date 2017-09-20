---
title: "Relay: State of the State"
author: [josephsavona]
---

This month marks a year since we released Relay and we'd like to share an update on the project and what's next.

## A Year In Review

A year after launch, we're incredibly excited to see an active community forming around Relay and that companies such as Twitter are [using Relay in production](https://fabric.io/blog/building-fabric-mission-control-with-graphql-and-relay):

> For a project like mission control, GraphQL and Relay were a near-perfect solution, and the cost of building it any other way justified the investment.
>
> -- <cite>Fin Hopkins</cite>

This kind of positive feedback is really encouraging (I'll admit to re-reading that post far too many times), and great motivation for us to keep going and make Relay even better.

With the community's help we've already come a long way since the technical preview. Here are some highlights:

- In March we added support for server-side rendering and for creating multiple instances of Relay on a single page. This was a coordinated effort over the course of several months by community members [Denis Nedelyaev](https://github.com/denvned) and [Gerald Monaco](https://github.com/devknoll) (now at Facebook).
- Also in March we added support for React Native. While we use Relay and React Native together internally, they didn't quite work together in open-source out of the box. We owe a big thanks to [Adam Miskiewicz](https://github.com/skevy), [Tom Burns](https://github.com/boourns), [Gaëtan Renaudeau](https://github.com/gre), [David Aurelio](https://github.com/davidaurelio), [Martín Bigio](https://github.com/martinbigio), [Paul O’Shannessy](https://github.com/zpao), [Sophie Alpert](https://github.com/sophiebits), and many others who helped track down and resolve issues. Finally, thanks to [Steven Luscher](https://github.com/steveluscher) for coordinating this effort and building the first Relay/ReactNative example app.

We've also seen some great open-source projects spring up around Relay:

- [Denis Nedelyaev](https://github.com/denvned) created [isomorphic-relay](https://github.com/denvned/isomorphic-relay/), a package that helps developers build server-rendered Relay apps where data is prepared on the server and then used to bootstrap the app on the client.
- [Jimmy Jia](https://github.com/taion) created [react-router-relay](https://github.com/relay-tools/react-router-relay) to integrate Relay data-fetching into React Router.
- [Pavel Chertorogov](https://github.com/nodkz) released [relay-network-layer](https://github.com/nodkz/react-relay-network-layer), which adds features such as batching query requests, middleware, authentication, logging, and more.

This is just a small sampling of the community's contributions. So far we've merged over 300 PRs - about 25% of our commits - from over 80 of you. These PRs have improved everything from the website and docs down the very core of the framework. We're humbled by these outstanding contributions and excited to keep working with each of you!

# Retrospective & Roadmap

Earlier this year we paused to reflect on the state of the project. What was working well? What could be improved? What features should we add, and what could we remove? A few themes emerged: performance on mobile, developer experience, and empowering the community.

## Mobile Perf

First, Relay was built to serve the needs of product developers at Facebook. In 2016, that means helping developers to build apps that work well on [mobile devices connecting on slower networks](https://newsroom.fb.com/news/2015/10/news-feed-fyi-building-for-all-connectivity/). For example, people in developing markets commonly use [2011 year-class phones](https://code.facebook.com/posts/307478339448736/year-class-a-classification-system-for-android/) and connect via [2G class networks](https://code.facebook.com/posts/952628711437136/classes-performance-and-network-segmentation-on-android/). These scenarios present their own challenges.

Therefore, one of our primary goals this year is to optimize Relay for performance on low-end mobile devices *first*, knowing that this can translate to improved performance on high-end devices as well. In addition to standard approaches such as benchmarking, profiling, and optimizations, we're also working on big-picture changes.

For example, in today's Relay, here's what happens when an app is opened. First, React Native starts initializing the JavaScript context (loading and parsing your code and then running it). When this finishes, the app executes and Relay sees that you need data. It constructs and prints the query, uploads the query text to the server, processes the response, and renders your app. (Note that this process applies on the web, except that the code has to be *downloaded* instead of loaded from the device.)

Ideally, though, we could begin fetching data as soon as the native code had loaded - in parallel with the JS context initialization. By the time your JS code was ready to run, the data-fetching would already be under way. To do this we would need a way to determine *statically* - at build time - what query an application would send.

The key is that GraphQL is already static - we just need to fully embrace this fact. More on this later.

## Developer Experience

Next, we've paid attention to the community's feedback and know that, to put it simply, Relay could be "easier" to use (and "simpler" too). This isn't entirely surprising to us - Relay was originally designed as a routing library and gradually morphed into a data-fetching library. Concepts like Relay "routes", for example, no longer serve as critical a role and are just one more concept that developers have to learn about. Another example is mutations: while writes *are* inherently more complex than reads, our API doesn't make the simple things simple enough.

Alongside our focus on mobile performance, we've also kept the developer experience in mind as we evolve Relay core.

## Empowering the Community

Finally, we want to make it easier for people in the community to develop useful libraries that work with Relay. By comparison, React's small surface area - components - allows developers to build cool things like routing, higher-order components, or reusable text editors. For Relay, this would mean having the framework provide core primitives that users can build upon. We want it to be possible for the community to integrate Relay with view libraries other than React, or to build real-time subscriptions as a complementary library.

# What's Next

These were big goals, and also a bit scary; we knew that incremental improvements would only allow us to move so fast. So in April we started a project to build a new implementation of Relay core targeting low-end mobile devices from the start.

As you can guess since we're writing this, the experiment was a success. The result is a new core that retains the best parts of Relay today - colocated components & data-dependencies, automatic data/view consistency, declarative data-fetching - while improving performance on mobile devices and addressing several common areas of confusion.

We're currently focused on shipping the first applications using the new core: ironing out bugs, refining the API changes and developer experience, and adding any missing features. We're excited to bring these changes to open source, and will do so once we've proven them in production. We'll go into more detail in some upcoming talks - links below - but for now here's an overview:

- **Static Queries**: By adding a couple of Relay-specific directives, we've been able to retain the expressivity of current Relay queries using static syntax (concretely: you know what query an app will execute just by looking at the source text, without having to run that code). For starters this will allow Relay apps to start fetching data in parallel with JavaScript initialization. But it also unlocks other possibilities: knowing the query ahead of time means that we can generate optimized code for handling query responses, for example, or for reading query data from an offline cache.
- **Expressive Mutations**: We'll continue to support a higher-level mutation API for common cases, but will also provide a lower-level API that allows "raw" data access where necessary. If you need to order a list of cached elements, for example, there will be a way to `sort()` it.
- **Route-less Relay**: Routes will be gone in open source. Instead of a route with multiple query definitions, you'll just provide a single query with as many root fields as you want.
- **Cache Eviction/Garbage Collection**: The API and architecture is designed from the start to allow removing cached data that is no longer referenced by a mounted view.

Stepping back, we recognize that any API changes will require an investment on your part. To make the transition easier, though, *we will continue to support the current API for the foreseeable future* (we're still using it too). And as much as possible we will open-source the tools that we use to migrate our own code. Ideas that we're exploring include codemods, an interoperability layer for the old/new APIs, and tutorials & guides to ease migration.

Ultimately, we're making these changes because we believe they make Relay better all around: simpler for developers building apps and faster for the people using them.

# Conclusion

If you made it this far, congrats and thanks for reading! We'll be sharing more information about these changes in some upcoming talks:

- [Greg Hurrell](https://github.com/wincent) will presenting a Relay "Deep Dive" at the [Silicon Valley ReactJS Meetup](http://www.meetup.com/Silicon-Valley-ReactJS-Meetup/events/232236845/) on August 17th.
- I ([@josephsavona](https://github.com/josephsavona)) will be speaking about Relay at [React Rally](http://www.reactrally.com) on August 25th.

We can't wait to share the new code with you and are working as fast as we can to do so!
