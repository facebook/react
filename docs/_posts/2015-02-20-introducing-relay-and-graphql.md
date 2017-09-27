---
title: "Introducing Relay and GraphQL"
layout: post
author: [wincent]
---

## Data fetching for React applications

There's more to building an application than creating a user interface. Data fetching is still a tricky problem, especially as applications become more complicated. At [React.js Conf](http://conf.reactjs.com/) we announced two projects we've created at Facebook to make data fetching simple for developers, even as a product grows to include dozens of contributors and the application becomes as complex as Facebook itself.

<iframe width="650" height="315" src="https://www.youtube-nocookie.com/embed/9sc8Pyc51uU" frameborder="0" allowfullscreen></iframe>

The two projects &mdash; Relay and GraphQL &mdash; have been in use in production at Facebook for some time, and we're excited to be bringing them to the world as open source in the future. In the meantime, we wanted to share some additional information about the projects here.

<script async class="speakerdeck-embed" data-id="7af7c2f33bf9451a892dcd91de55b7c2" data-ratio="1.29456384323641" src="//speakerdeck.com/assets/embed.js"></script>

## What is Relay?

Relay is a new framework from Facebook that provides data-fetching functionality for React applications. It was announced at React.js Conf (January 2015).

Each component specifies its own data dependencies declaratively using a query language called GraphQL. The data is made available to the component via properties on `this.props`.

Developers compose these React components naturally, and Relay takes care of composing the data queries into efficient batches, providing each component with exactly the data that it requested (and no more), updating those components when the data changes, and maintaining a client-side store (cache) of all data.

## What is GraphQL?

GraphQL is a data querying language designed to describe the complex, nested data dependencies of modern applications. It's been in production use in Facebook's native apps for several years.

On the server, we configure the GraphQL system to map queries to underlying data-fetching code. This configuration layer allows GraphQL to work with arbitrary underlying storage mechanisms. Relay uses GraphQL as its query language, but it is not tied to a specific implementation of GraphQL.

## The value proposition

Relay was born out of our experiences building large applications at Facebook. Our overarching goal is to enable developers to create correct, high-performance applications in a straightforward and obvious way. The design enables even large teams to make changes with a high degree of isolation and confidence. Fetching data is hard, dealing with ever-changing data is hard, and performance is hard. Relay aims to reduce these problems to simple ones, moving the tricky bits into the framework and freeing you to concentrate on building your application.

By co-locating the queries with the view code, the developer can reason about what a component is doing by looking at it in isolation; it's not necessary to consider the context where the component was rendered in order to understand it. Components can be moved anywhere in a render hierarchy without having to apply a cascade of modifications to parent components or to the server code which prepares the data payload.

Co-location leads developers to fall into the "pit of success", because they get exactly the data they asked for and the data they asked for is explicitly defined right next to where it is used. This means that performance becomes the default (it becomes much harder to accidentally over-fetch), and components are more robust (under-fetching is also less likely for the same reason, so components won't try to render missing data and blow up at runtime).

Relay provides a predictable environment for developers by maintaining an invariant: a component won't be rendered until all the data it requested is available. Additionally, queries are defined statically (ie. we can extract queries from a component tree before rendering) and the GraphQL schema provides an authoritative description of what queries are valid, so we can validate queries early and fail fast when the developer makes a mistake.

Only the fields of an object that a component explicitly asks for will be accessible to that component, even if other fields are known and cached in the store (because another component requested them). This makes it impossible for implicit data dependency bugs to exist latently in the system.

By handling all data-fetching via a single abstraction, we're able to handle a bunch of things that would otherwise have to be dealt with repeatedly and pervasively across the application:

- **Performance:** All queries flow through the framework code, where things that would otherwise be inefficient, repeated query patterns get automatically collapsed and batched into efficient, minimal queries. Likewise, the framework knows which data have been previously requested, or for which requests are currently "in flight", so queries can be automatically de-duplicated and the minimal queries can be produced.
- **Subscriptions:** All data flows into a single store, and all reads from the store are via the framework. This means the framework knows which components care about which data and which should be re-rendered when data changes; components never have to set up individual subscriptions.
- **Common patterns:** We can make common patterns easy. Pagination is the example that [Jing](https://twitter.com/jingc) gave at the conference: if you have 10 records initially, getting the next page just means declaring you want 15 records in total, and the framework automatically constructs the minimal query to grab the delta between what you have and what you need, requests it, and re-renders your view when the data become available.
- **Simplified server implementation:** Rather than having a proliferation of end-points (per action, per route), a single GraphQL endpoint can serve as a facade for any number of underlying resources.
- **Uniform mutations:** There is one consistent pattern for performing mutations (writes), and it is conceptually baked into the data querying model itself. You can think of a mutation as a query with side-effects: you provide some parameters that describe the change to be made (eg. attaching a comment to a record) and a query that specifies the data you'll need to update your view of the world after the mutation completes (eg. the comment count on the record), and the data flows through the system using the normal flow. We can do an immediate "optimistic" update on the client (ie. update the view under the assumption that the write will succeed), and finally commit it, retry it or roll it back in the event of an error when the server payload comes back.

## How does it relate to Flux?

In some ways Relay is inspired by Flux, but the mental model is much simpler. Instead of multiple stores, there is one central store that caches all GraphQL data. Instead of explicit subscriptions, the framework itself can track which data each component requests, and which components should be updated whenever the data change. Instead of actions, modifications take the form of mutations.

At Facebook, we have apps built entirely using Flux, entirely using Relay, or with both. One pattern we see emerging is letting Relay manage the bulk of the data flow for an application, but using Flux stores on the side to handle a subset of application state.

## Open source plans

We're working very hard right now on getting both GraphQL (a spec, and a reference implementation) and Relay ready for public release (no specific dates yet, but we are super excited about getting these out there).

In the meantime, we'll be providing more and more information in the form of blog posts (and in [other channels](https://gist.github.com/wincent/598fa75e22bdfa44cf47)). As we get closer to the open source release, you can expect more concrete details, syntax and API descriptions and more.

Watch this space!
