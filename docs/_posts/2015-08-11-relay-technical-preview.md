---
title: "Relay Technical Preview"
author: [josephsavona]
---

# Relay

Today we're excited to share an update on Relay - the technical preview is now open-source and [available on GitHub](http://github.com/facebook/relay).

## Why Relay

While React simplified the process of developing complex user-interfaces, it left open the question of how to interact with data on the server. It turns out that this was a significant source of friction for our developers; fragile coupling between client and server caused data-related bugs and made iteration harder. Furthermore, developers were forced to constantly re-implement complex async logic instead of focusing on their apps. Relay addresses these concerns by borrowing important lessons from React: it provides *declarative, component-oriented data fetching for React applications*.

Declarative data-fetching means that Relay applications specify *what* data they need, not *how* to fetch that data. Just as React uses a description of the desired UI to manage view updates, Relay uses a data description in the form of GraphQL queries. Given these descriptions, Relay coalesces queries into batches for efficiency, manages error-prone asynchronous logic, caches data for performance, and automatically updates views as data changes.

Relay is also component-oriented, extending the notion of a React component to include a description of what data is necessary to render it. This colocation allows developers to reason locally about their application and eliminates bugs such as under- or over-fetching data.

Relay is in use at Facebook in production apps, and we're using it more and more because *Relay lets developers focus on their products and move fast*. It's working for us and we'd like to share it with the community.

## What's Included

We're open-sourcing a technical preview of Relay - the core framework that we use internally, with some modifications for use outside Facebook. As this is the first release, it's good to keep in mind that there may be some incomplete or missing features. We'll continue to develop Relay and are working closely with the GraphQL community to ensure that Relay tracks updates during GraphQL's RFC period. But we couldn't wait any longer to get this in your hands, and we're looking forward to your feedback and contributions.

Relay is available on [GitHub](http://github.com/facebook/relay) and [npm](https://www.npmjs.com/package/react-relay).

## What's Next

The team is super excited to be releasing Relay - and just as excited about what's next. Here are some of the things we'll be focusing on:

- Offline support. This will allow applications to fulfill queries and enqueue updates without connectivity.
- Real-time updates. In collaboration with the GraphQL community, we're working to define a specification for subscriptions and provide support for them in Relay.
- A generic Relay. Just as the power of React was never about the virtual DOM, Relay is much more than a GraphQL client. We're working to extend Relay to provide a unified interface for interacting not only with server data, but also in-memory and native device data (and, even better, a mix of all three).
- Finally, it's all too easy as developers to focus on those people with the newest devices and fastest internet connections. We're working to make it easier to build applications that are robust in the face of slow or intermittent connectivity.

Thanks!
