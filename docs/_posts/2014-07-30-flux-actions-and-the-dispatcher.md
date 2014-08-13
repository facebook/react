---
title: "Flux: Actions and the Dispatcher"
author: Bill Fisher
---

Flux is the application architecture Facebook uses to build JavaScript applications. It's based on a unidirectional data flow.  We've built everything from small widgets to huge applications with Flux, and it's handled everything we've thrown at it. Because we've found it to be a great way to structure our code, we're excited to share it with the open source community. [Jing Chen presented Flux](http://youtu.be/nYkdrAPrdcw?t=10m20s) at the F8 conference, and since that time we've seen a lot of interest in it. We've also published an [overview of Flux](http://facebook.github.io/flux/docs/overview.html) and a [TodoMVC example](https://github.com/facebook/flux/tree/master/examples/flux-todomvc/), with an accompanying [tutorial](http://facebook.github.io/flux/docs/todo-list.html).

Flux is more of a pattern than a full-blown framework, and you can start using it without a lot of new code beyond React. Up until recently, however, we haven't released one crucial piece of our Flux software: the dispatcher. But along with the creation of the new [Flux code repository](https://github.com/facebook/flux) and [Flux website](http://facebook.github.io/flux/), we've now open sourced the same [dispatcher](http://facebook.github.io/flux/docs/dispatcher.html) we use in our production applications.


Where the Dispatcher Fits in the Flux Data Flow
-----------------------------------------------

The dispatcher is a singleton, and operates as the central hub of data flow in a Flux application. It is essentially a registry of callbacks, and can invoke these callbacks in order. Each _store_ registers a callback with the dispatcher. When new data comes into the dispatcher, it then uses these callbacks to propagate that data to all of the stores. The process of invoking the callbacks is initiated through the dispatch() method, which takes a data payload object as its sole argument.


Actions and ActionCreators
--------------------------

When new data enters the system, whether through a person interacting with the application or through a web api call, that data is packaged into an _action_ — an object literal containing the new fields of data and a specific action type. We often create a library of helper methods called ActionCreators that not only create the action object, but also pass the action to the dispatcher.

Different actions are identified by a type attribute. When all of the stores receive the action, they typically use this attribute to determine if and how they should respond to it. In a Flux application, both stores and views control themselves; they are not acted upon by external objects. Actions flow into the stores through the callbacks they define and register, not through setter methods.

Letting the stores update themselves eliminates many entanglements typically found in MVC applications, where cascading updates between models can lead to unstable state and make accurate testing very difficult. The objects within a Flux application are highly decoupled, and adhere very strongly to the [Law of Demeter](http://en.wikipedia.org/wiki/Law_of_Demeter), the principle that each object within a system should know as little as possible about the other objects in the system. This results in software that is more maintainable, adaptable, testable, and easier for new engineering team members to understand.

<img src="/react/img/blog/flux-diagram.png" style="width: 100%;" />


Why We Need a Dispatcher
------------------------

As an application grows, dependencies across different stores are a near certainty. Store A will inevitably need Store B to update itself first, so that Store A can know how to update itself. We need the dispatcher to be able to invoke the callback for Store B, and finish that callback, before moving forward with Store A. To declaratively assert this dependency, a store needs to be able to say to the dispatcher, "I need to wait for Store B to finish processing this action." The dispatcher provides this functionality through its waitFor() method.

The dispatch() method provides a simple, synchronous iteration through the callbacks, invoking each in turn. When waitFor() is encountered within one of the callbacks, execution of that callback stops and waitFor() provides us with a new iteration cycle over the dependencies. After the entire set of dependencies have been fulfilled, the original callback then continues to execute.

Further, the waitFor() method may be used in different ways for different actions, within the same store's callback.  In one case, Store A might need to wait for Store B.  But in another case, it might need to wait for Store C.  Using waitFor() within the code block that is specific to an action allows us to have fine-grained control of these dependencies.

Problems arise, however, if we have circular dependencies. That is, if Store A needs to wait for Store B, and Store B needs to wait for Store A, we could wind up in an endless loop. The dispatcher now available in the Flux repo protects against this by throwing an informative error to alert the developer that this problem has occurred. The developer can then create a third store and resolve the circular dependency.


Example Chat App
----------------

Along with the same dispatcher that Facebook uses in its production applications, we've also published a new example [chat app](https://github.com/facebook/flux/tree/master/examples/flux-chat), slightly more complicated than the simplistic TodoMVC, so that engineers can better understand how Flux solves problems like dependencies between stores and calls to a web API.

We're hopeful that the new Flux repository will grow with time to include additional tools, boilerplate code and further examples. And we hope that Flux will prove as useful to you as it has to us. Enjoy!
