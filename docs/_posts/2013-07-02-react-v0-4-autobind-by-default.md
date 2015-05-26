---
title: "New in React v0.4: Autobind by Default"
author: zpao
---

React v0.4 is very close to completion. As we finish it off, we'd like to share with you some of the major changes we've made since v0.3. This is the first of several posts we'll be making over the next week.


## What is React.autoBind?

If you take a look at most of our current examples, you'll see us using `React.autoBind` for event handlers. This is used in place of `Function.prototype.bind`. Remember that in JS, [function calls are late-bound](https://bonsaiden.github.io/JavaScript-Garden/#function.this). That means that if you simply pass a function around, the `this` used inside won't necessarily be the `this` you expect. `Function.prototype.bind` creates a new, properly bound, function so that when called, `this` is exactly what you expect it to be.

Before we launched React, we would write this:

```js{4}
React.createClass({
  onClick: function(event) {/* do something with this */},
  render: function() {
    return <button onClick={this.onClick.bind(this)} />;
  }
});
```

We wrote `React.autoBind` as a way to cache the function creation and save on memory usage. Since `render` can get called multiple times, if you used `this.onClick.bind(this)` you would actually create a new function on each pass. With React v0.3 you were able to write this instead:

```js{2,4}
React.createClass({
  onClick: React.autoBind(function(event) {/* do something with this */}),
  render: function() {
    return <button onClick={this.onClick} />;
  }
});
```


## What's Changing in v0.4?

After using `React.autoBind` for a few weeks, we realized that there were very few times that we didn't want that behavior. So we made it the default! Now all methods defined within `React.createClass` will already be bound to the correct instance.

Starting with v0.4 you can just write this:

```js{2,4}
React.createClass({
  onClick: function(event) {/* do something with this */},
  render: function() {
    return <button onClick={this.onClick} />;
  }
});
```

For v0.4 we will simply be making `React.autoBind` a no-op — it will just return the function you pass to it. Most likely you won't have to change your code to account for this change, though we encourage you to update. We'll publish a migration guide documenting this and other changes that come along with React v0.4.
