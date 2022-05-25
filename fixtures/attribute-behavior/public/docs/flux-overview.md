---
id: flux-overview
title: Flux Application Architecture
layout: docs
next: flux-todo-list.html
---

Flux is the application architecture that Facebook uses for building client-side web applications.  It complements React's composable view components by utilizing a unidirectional data flow.  It's more of a pattern rather than a formal framework, and you can start using Flux immediately without a lot of new code.

<figure><iframe width="560" height="315" src="//www.youtube.com/embed/nYkdrAPrdcw?list=PLb0IAmt7-GS188xDYE-u1ShQmFFGbrk0v" frameborder="0" allowfullscreen></iframe></figure>

Flux applications have three major parts: the dispatcher, the stores, and the views (React components).  These should not be confused with Model-View-Controller.  Controllers do exist in a Flux application, but they are controller-views — views often found at the top of the hierarchy that retrieve data from the stores and pass this data down to their children.  Additionally, actions — dispatcher helper methods — are often used to support a semantic dispatcher API.  It can be useful to think of them as a fourth part of the Flux update cycle.

Flux eschews MVC in favor of a unidirectional data flow. When a user interacts with a React view, the view propagates an action through a central dispatcher, to the various stores that hold the application's data and business logic, which updates all of the views that are affected. This works especially well with React's declarative programming style, which allows the store to send updates without specifying how to transition views between states.

We originally set out to deal correctly with derived data: for example, we wanted to show an unread count for message threads while another view showed a list of threads, with the unread ones highlighted. This was difficult to handle with MVC — marking a single thread as read would update the thread model, and then also need to update the unread count model.  These dependencies and cascading updates often occur in a large MVC application, leading to a tangled weave of data flow and unpredictable results.

Control is inverted with stores: the stores accept updates and reconcile them as appropriate, rather than depending on something external to update its data in a consistent way. Nothing outside the store has any insight into how it manages the data for its domain, helping to keep a clear separation of concerns. This also makes stores more testable than models, especially since stores have no direct setter methods like `setAsRead()`, but instead have only an input point for the payload, which is delivered through the dispatcher and originates with actions.


## Structure and Data Flow

Data in a Flux application flows in a single direction, in a cycle:

<pre>
Views ---> (actions) ----> Dispatcher ---> (registered callback) ---> Stores -------+
Ʌ                                                                                   |
|                                                                                   V
+-- (Controller-Views "change" event handlers) ---- (Stores emit "change" events) --+
</pre>

A unidirectional data flow is central to the Flux pattern, and in fact Flux takes its name from the Latin word for flow. In the above diagram, the dispatcher, stores and views are independent nodes with distinct inputs and outputs. The actions are simply discrete, semantic helper functions that facilitate passing data to the dispatcher. 

All data flows through the dispatcher as a central hub.  Actions most often originate from user interactions with the views, and are nothing more than a call into the dispatcher.  The dispatcher then invokes the callbacks that the stores have registered with it, effectively dispatching the data payload contained in the actions to all stores.  Within their registered callbacks, stores determine which actions they are interested in, and respond accordingly.  The stores then emit a "change" event to alert the controller-views that a change to the data layer has occurred.  Controller-views listen for these events and retrieve data from the stores in an event handler.  The controller-views call their own `render()` method via `setState()` or `forceUpdate()`, updating themselves and all of their children.

This structure allows us to reason easily about our application in a way that is reminiscent of functional reactive programming, or more specifically data-flow programming or flow-based programming, where data flows through the application in a single direction — there are no two-way bindings. Application state is maintained only in the stores, allowing the different parts of the application to remain highly decoupled. Where dependencies do occur between stores, they are kept in a strict hierarchy, with synchronous updates managed by the dispatcher. 

We found that two-way data bindings led to cascading updates, where changing one object led to another object changing, which could also trigger more updates. As applications grew, these cascading updates made it very difficult to predict what would change as the result of one user interaction. When updates can only change data within a single round, the system as a whole becomes more predictable.

Let's look at the various parts of the Flux update cycle up close. A good place to start is the dispatcher. 


### A Single Dispatcher 

The dispatcher is the central hub that manages all data flow in a Flux application. It is essentially a registry of callbacks into the stores. Each store registers itself and provides a callback. When the dispatcher responds to an action, all stores in the application are sent the data payload provided by the action via the callbacks in the registry. 

As an application grows, the dispatcher becomes more vital, as it can manage dependencies between stores by invoking the registered callbacks in a specific order.  Stores can declaratively wait for other stores to finish updating, and then update themselves accordingly.


### Stores 

Stores contain the application state and logic. Their role is somewhat similar to a model in a traditional MVC, but they manage the state of many objects — they are not instances of one object. Nor are they the same as Backbone's collections. More than simply managing a collection of ORM-style objects, stores manage the application state for a particular __domain__ within the application. 

For example, Facebook's [Lookback Video Editor](https://facebook.com/lookback/edit) utilized a TimeStore that kept track of the playback time position and the playback state. On the other hand, the same application's ImageStore kept track of a collection of images.  The TodoStore in our [TodoMVC example](https://github.com/facebook/react/tree/master/examples/todomvc-flux) is similar in that it manages a collection of to-do items.  A store exhibits characteristics of both a collection of models and a singleton model of a logical domain. 

As mentioned above, a store registers itself with the dispatcher and provides it with a callback. This callback receives the action's data payload as a parameter. The payload contains a type attribute, identifying the action's type. Within the store's registered callback, a switch statement based on the action's type is used to interpret the payload and to provide the proper hooks into the store's internal methods. This allows an action to result in an update to the state of the store, via the dispatcher. After the stores are updated, they broadcast an event declaring that their state has changed, so the views may query the new state and update themselves. 


### Views and Controller-Views 
 
React provides the kind of composable views we need for the view layer. Close to the top of the nested view hierarchy, a special kind of view listens for events that are broadcast by the stores that it depends on. One could call this a controller-view, as it provides the glue code to get the data from the stores and to pass this data down the chain of its descendants. We might have one of these controller-views governing any significant section of the page.  

When it receives the event from the store, it first requests the new data it needs via the stores' public getter methods. It then calls its own `setState()` or `forceUpdate()` methods, causing its `render()` method and the `render()` method of all its descendants to run. 

We often pass the entire state of the store down the chain of views in a single object, allowing different descendants to use what they need. In addition to keeping the controller-like behavior at the top of the hierarchy, and thus keeping our descendant views as functionally pure as possible, passing down the entire state of the store in a single object also has the effect of reducing the number of props we need to manage. 

Occasionally we may need to add additional controller-views deeper in the hierarchy to keep components simple.  This might help us to better encapsulate a section of the hierarchy related to a specific  data domain.  Be aware, however, that controller-views deeper in the hierarchy can violate the singular flow of data by introducing a new, potentially conflicting entry point for the data flow.  In making the decision of whether to add a deep controller-view, balance the gain of simpler components against the complexity of multiple data updates flowing into the hierarchy at different points.  These multiple data updates can lead to odd effects, with React's render method getting invoked repeatedly by updates from different controller-views, potentially increasing the difficulty of debugging.


### Actions 

The dispatcher exposes a method that allows a view to trigger a dispatch to the stores, and to include a payload of data, or an action. The action construction may be wrapped into a semantic helper method which sends the payload to the dispatcher. For example, we may want to change the text of a to-do item in a to-do list application. We would create an action with a function signature like `updateText(todoId, newText)` in our `TodoActions` module. This method may be invoked from within our views' event handlers, so we can call it in response to a user action. This action method also adds the action type to the payload, so that when the payload is interpreted in the store, it can respond appropriately to a payload with a particular action type. In our example, this type might be named something like `TODO_UPDATE_TEXT`. 

Actions may also come from other places, such as the server. This happens, for example, during data initialization. It may also happen when the server returns an error code or when the server has updates to provide to the application. We'll talk more about server actions in a future article. In this post we're only concerned with the basics of the data flow.


### What About that Dispatcher? 

As mentioned earlier, the dispatcher is also able to manage dependencies between stores. This functionality is available through the `waitFor()` method within the Dispatcher class.  We did not need to use this method within the extremely simple [TodoMVC application](https://github.com/facebook/react/tree/master/examples/todomvc-flux), but we have included it [in the example dispatcher](https://github.com/facebook/react/blob/master/examples/todomvc-flux/js/dispatcher/Dispatcher.js#L110) as an example of what a dispatcher should be able to do in a larger, more complex application.

Within the TodoStore's registered callback we could explicitly wait for any dependencies to first update before moving forward: 

```javascript
case 'TODO_CREATE': 
  Dispatcher.waitFor([ 
    PrependedTextStore.dispatcherIndex, 
    YetAnotherStore.dispatcherIndex 
  ], function() { 
    TodoStore.create(PrependedTextStore.getText() + ' ' + action.text); 
    TodoStore.emit('change'); 
  }); 
  break; 
```

The arguments for `waitFor()` are an array of dipatcher registry indexes, and a final callback to invoke after the callbacks at the given indexes have completed.  Thus the store that is invoking `waitFor()` can depend on the state of another store to inform how it should update its own state.

A problem arises if we create circular dependencies. If Store A waits for Store B, and B waits for A, then we'll have a very bad situation on our hands. We'll need a more robust dispatcher that flags these circular dependencies with console errors, and this is not easily accomplished with promises. Unfortunately, that's a bit beyond the scope of this documentation. In the future we hope to cover how to build a more robust dispatcher and how to initialize, update, and save the state of the application with persistent data, like a web service API.
