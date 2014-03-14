# Flux TodoMVC Example

> An application architecture for React utilizing a unidirectional data flow.


## Learning Flux

The [React website](http://facebook.github.io/react) is a great resource for getting started.

A post on the [React Blog](http://facebook.github.io/react/blog/) is forthcoming to describe the Flux architecture in more detail.


## Implementation

Flux applications have three major parts: the Dispatcher, the Stores, and the Views (React components).  These should not be confused with Model-View-Controller.  Controllers do exist in a Flux application, but they are Controller-Views -- top level views that retrieve data from the Stores and pass this data down to their children.

Data in a Flux application flows in a single direction, in a cycle:

<pre>
Views ---> (actions) ----> Dispatcher ---> (registerd callback) ---> Stores --------+
Ʌ                                                                                   |
|                                                                                   V
+-- (Controller-Views "change" event handlers) ---- (Stores emit "change" events) --+
</pre>

All data flows through the Dispatcher as a central hub.  Actions most often originate from user interactions with the Views, and are nothing more than a call into the Dispatcher.  The Dispatcher then calls the callbacks that the Stores have registered with it, effectively dispatching the data contained in the actions to all Stores.  Within their registered callbacks, Stores determine which actions they are interested in, and respond accordingly.  The stores then emit a "change" event to alert the Views that a change to the data layer has occurred.  Controller-Views listen for these events and retrieve data from the Stores in an event handler.  The View-Controllers call their own render() method via setState() or forceUpdate(), updating themselves and all of their children.

In this TodoMVC example application, we can see these elements in our directory structure.  Views here are referred to as "components" as they are React components.

<pre>
./
  index.html
  js/
    actions/
      TodoActions.js
    app.js
    bundle.js
    dispatcher/
      AppDispatcher.js
      Dispatcher.js
    components/
      Footer.react.js
      Header.react.js
      MainSection.react.js
      TodoApp.react.js
      TodoItem.react.js
      TodoTextInput.react.js
    stores/
      TodoStore.js
</pre>

The primary entry point into the application is app.js.  This file bootstraps the React rendering inside of index.html.  TodoApp.js is our Controller-View and it passes all data down into its child React components.

TodoActions.js is a collection of actions that views may call from within their event handlers, in response to user interactions.  They are nothing more than helpers that call into the AppDispatcher.

Dispatcher.js is a base class for AppDispatcher.js which extends it with a small amount of application-specific code.  This Dispatcher is a naive implementation based on promises, but much more robust implementations are possible.

TodoStore.js is our only Store.  It provides all of the application logic and in-memory storage.  Based on EventEmitter from Node.js, it emits "change" events after responding to actions in the callback it registers with the Dispatcher.

The bundle.js file is automatically genenerated by the build process, explained below.


## Running

You must have [npm](https://www.npmjs.org/) installed on your computer.
From the root project directory run these commands from the command line:

    npm install

This will install all dependencies.

To build the project, first run this command:

    npm start

This will perform an initial build and start a watcher process that will update build.js with any changes you wish to make.  This watcher is based on [Browserify](http://browserify.org/) and [Watchify](https://github.com/substack/watchify), and it transforms React's JSX syntax into standard JavaScript with [Reactify](https://github.com/andreypopp/reactify).

To run the app, spin up an HTTP server and visit http://localhost/.../todomvc-flux/.


## Credit

This TodoMVC application was created by [Bill Fisher](https://www.facebook.com/bill.fisher.771).


## License

> Copyright 2013-2014 Facebook, Inc.
>
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.
