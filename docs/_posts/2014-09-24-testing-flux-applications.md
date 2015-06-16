---
title: "Testing Flux Applications"
author: fisherwebdev
---

**A more up-to-date version of this post is available as part of the [Flux documentation](https://facebook.github.io/flux/docs/testing-flux-applications.html).**

[Flux](https://facebook.github.io/flux/) is the application architecture that Facebook uses to build web applications with [React](/react/). It's based on a unidirectional data flow. In previous blog posts and documentation articles, we've shown the [basic structure and data flow](https://facebook.github.io/flux/docs/overview.html), more closely examined the [dispatcher and action creators](/react/blog/2014/07/30/flux-actions-and-the-dispatcher.html), and shown how to put it all together with a [tutorial](https://facebook.github.io/flux/docs/todo-list.html). Now let's look at how to do formal unit testing of Flux applications with [Jest](https://facebook.github.io/jest/), Facebook's auto-mocking testing framework.


Testing with Jest
-----------------

For a unit test to operate on a truly isolated _unit_ of the application, we need to mock every module except the one we are testing. Jest makes the mocking of other parts of a Flux application trivial. To illustrate testing with Jest, we'll return to our [example TodoMVC application](https://github.com/facebook/flux/tree/master/examples/flux-todomvc).

The first steps toward working with Jest are as follows:

1. Get the module dependencies for the application installed by running `npm install`.
2. Create a directory `__tests__/` with a test file, in this case TodoStore-test.js
3. Run `npm install jest-cli —save-dev`
4. Add the following to your package.json

```javascript
{
  ...
  "scripts": {
    "test": "jest"
  }
  ...
}
```

Now you're ready to run your tests from the command line with `npm test`.

By default, all modules are mocked, so the only boilerplate we need in TodoStore-test.js is a declarative call to Jest's `dontMock()` method.

```javascript
jest.dontMock('TodoStore');
```

This tells Jest to let TodoStore be a real object with real, live methods. Jest will mock all other objects involved with the test.


Testing Stores
--------------

At Facebook, Flux stores often receive a great deal of formal unit test coverage, as this is where the application state and logic lives. Stores are arguably the most important place in a Flux application to provide coverage, but at first glance, it's not entirely obvious how to test them.

By design, stores can't be modified from the outside. They have no setters. The only way new data can enter a store is through the callback it registers with the dispatcher.

We therefore need to simulate the Flux data flow with this _one weird trick_.

```javascript
var mockRegister = MyDispatcher.register;
var mockRegisterInfo = mockRegister.mock;
var callsToRegister = mockRegisterInfo.calls;
var firstCall = callsToRegister[0];
var firstArgument = firstCall[0];
var callback = firstArgument;
```

We now have the store's registered callback, the sole mechanism by which data can enter the store.

For folks new to Jest, or mocks in general, it might not be entirely obvious what is happening in that code block, so let's look at each part of it a bit more closely. We start out by looking at the `register()` method of our application's dispatcher — the method that the store uses to register its callback with the dispatcher. The dispatcher has been thoroughly mocked automatically by Jest, so we can get a reference to the mocked version of the `register()` method just as we would normally refer to that method in our production code. But we can get additional information about that method with the `mock` _property_ of that method. We don't often think of methods having properties, but in Jest, this idea is vital. Every method of a mocked object has this property, and it allows us to examine how the method is being called during the test. A chronologically ordered list of calls to `register()` is available with the `calls` property of `mock`, and each of these calls has a list of the arguments that were used in each method call.

So in this code, we are really saying, "Give me a reference to the first argument of the first call to MyDispatcher's `register()` method." That first argument is the store's callback, so now we have all we need to start testing.  But first, we can save ourselves some semicolons and roll all of this into a single line:

```javascript
callback = MyDispatcher.register.mock.calls[0][0];
```

We can invoke that callback whenever we like, independent of our application's dispatcher or action creators. We will, in fact, fake the behavior of the dispatcher and action creators by invoking the callback with an action that we'll create directly in our test.

```javascript
var payload = {
  source: 'VIEW_ACTION',
  action: {
    actionType: TodoConstants.TODO_CREATE,
    text: 'foo'
  }
};
callback(payload);
var all = TodoStore.getAll();
var keys = Object.keys(all);
expect(all[keys[0]].text).toEqual('foo');
```

Putting it All Together
----------------------

The example Flux TodoMVC application has been updated with an example test for the TodoStore, but let's look at an abbreviated version of the entire test. The most important things to notice in this test are how we keep a reference to the store's registered callback in the closure of the test, and how we recreate the store before every test so that we clear the state of the store entirely.

```javascript
jest.dontMock('../TodoStore');
jest.dontMock('react/lib/merge');

describe('TodoStore', function() {

  var TodoConstants = require('../../constants/TodoConstants');

  // mock actions inside dispatch payloads
  var actionTodoCreate = {
    source: 'VIEW_ACTION',
    action: {
      actionType: TodoConstants.TODO_CREATE,
      text: 'foo'
    }
  };
  var actionTodoDestroy = {
    source: 'VIEW_ACTION',
    action: {
      actionType: TodoConstants.TODO_DESTROY,
      id: 'replace me in test'
    }
  };

  var AppDispatcher;
  var TodoStore;
  var callback;

  beforeEach(function() {
    AppDispatcher = require('../../dispatcher/AppDispatcher');
    TodoStore = require('../TodoStore');
    callback = AppDispatcher.register.mock.calls[0][0];
  });

  it('registers a callback with the dispatcher', function() {
    expect(AppDispatcher.register.mock.calls.length).toBe(1);
  });

  it('initializes with no to-do items', function() {
    var all = TodoStore.getAll();
    expect(all).toEqual({});
  });

  it('creates a to-do item', function() {
    callback(actionTodoCreate);
    var all = TodoStore.getAll();
    var keys = Object.keys(all);
    expect(keys.length).toBe(1);
    expect(all[keys[0]].text).toEqual('foo');
  });

  it('destroys a to-do item', function() {
    callback(actionTodoCreate);
    var all = TodoStore.getAll();
    var keys = Object.keys(all);
    expect(keys.length).toBe(1);
    actionTodoDestroy.action.id = keys[0];
    callback(actionTodoDestroy);
    expect(all[keys[0]]).toBeUndefined();
  });

});
```

You can take a look at all this code in the [TodoStore's tests on GitHub](https://github.com/facebook/flux/tree/master/examples/flux-todomvc/js/stores/__tests__/TodoStore-test.js) as well. 


Mocking Data Derived from Other Stores
--------------------------------------

Sometimes our stores rely on data from other stores. Because all of our modules are mocked, we'll need to simulate the data that comes from the other store.  We can do this by retrieving the mock function and adding a custom return value to it.

```javascript
var MyOtherStore = require('../MyOtherStore');
MyOtherStore.getState.mockReturnValue({
  '123': {
    id: '123',
    text: 'foo'
  },
  '456': {
    id: '456',
    text: 'bar'
  }
});
```

Now we have a collection of objects that will come back from MyOtherStore whenever we call MyOtherStore.getState() in our tests.  Any application state can be simulated with a combination of these custom return values and the previously shown technique of working with the store's registered callback.

A brief example of this technique is up on GitHub within the Flux Chat example's [UnreadThreadStore-test.js](https://github.com/facebook/flux/tree/master/examples/flux-chat/js/stores/__tests__/UnreadThreadStore-test.js).

For more information about the `mock` property of mocked methods or Jest's ability to provide custom mock values, see Jest's documentation on [mock functions](https://facebook.github.io/jest/docs/mock-functions.html).


Moving Logic from React to Stores
---------------------------------

What often starts as a little piece of seemingly benign logic in our React components often presents a problem while creating unit tests. We want to be able to write tests that read like a specification for our application's behavior, and when application logic slips into our view layer, this becomes more difficult.

For example, when a user has marked each of their to-do items as complete, the TodoMVC specification dictates that we should also change the status of the "Mark all as complete" checkbox automatically. To create that logic, we might be tempted to write code like this in our MainSection's `render()` method:

```javascript
var allTodos = this.props.allTodos;
var allChecked = true;
for (var id in allTodos) {
  if (!allTodos[id].complete) {
    allChecked = false;
    break;
  }
}
...

return (
  <section id="main">
  <input
    id="toggle-all"
    type="checkbox"
    checked={allChecked ? 'checked' : ''}
  />
  ...
  </section>
);
```

While this seems like an easy, normal thing to do, this is an example of application logic slipping into the views, and it can't be described in our spec-style TodoStore test. Let's take that logic and move it to the store. First, we'll create a public method on the store that will encapsulate that logic:

```javascript
areAllComplete: function() {
  for (var id in _todos) {
    if (!_todos[id].complete) {
      return false;
    }
  }
  return true;
},
```

Now we have the application logic where it belongs, and we can write the following test:

```javascript
it('determines whether all to-do items are complete', function() {
  var i = 0;
  for (; i < 3; i++) {
    callback(mockTodoCreate);
  }
  expect(TodoStore.areAllComplete()).toBe(false);

  var all = TodoStore.getAll();
  for (key in all) {
    callback({
      source: 'VIEW_ACTION',
      action: {
        actionType: TodoConstants.TODO_COMPLETE,
        id: key
      }
    });
  }
  expect(TodoStore.areAllComplete()).toBe(true);

  callback({
    source: 'VIEW_ACTION',
    action: {
      actionType: TodoConstants.TODO_UNDO_COMPLETE,
      id: key
    }
  });
  expect(TodoStore.areAllComplete()).toBe(false);
});
```

Finally, we revise our view layer. We'll call for that data in the controller-view, TodoApp.js, and pass it down to the MainSection component.

```javascript
function getTodoState() {
  return {
    allTodos: TodoStore.getAll(),
    areAllComplete: TodoStore.areAllComplete()
  };
}

var TodoApp = React.createClass({
...

  /**
   * @return {object}
   */
  render: function() {
    return (
      ...
      <MainSection
        allTodos={this.state.allTodos}
        areAllComplete={this.state.areAllComplete}
      />
      ...
    );
  },

  /**
   * Event handler for 'change' events coming from the TodoStore
   */
  _onChange: function() {
    this.setState(getTodoState());
  }

});
```

And then we'll utilize that property for the rendering of the checkbox.

```javascript
render: function() {
  ...

  return (
    <section id="main">
    <input
      id="toggle-all"
      type="checkbox"
      checked={this.props.areAllComplete ? 'checked' : ''}
    />
    ...
    </section>
  );
},
```

To learn how to test React components themselves, check out the [Jest tutorial for React](https://facebook.github.io/jest/docs/tutorial-react.html) and the [ReactTestUtils documentation](/react/docs/test-utils.html).


Further Reading
---------------

- [Mocks Aren't Stubs](http://martinfowler.com/articles/mocksArentStubs.html) by Martin Fowler
- [Jest API Reference](https://facebook.github.io/jest/docs/api.html)
