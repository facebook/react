# react-addons-linked-state-mixin

>**Note:**
>This is a legacy React addon, and is no longer maintained.
>
>We don't encourage using it in new code, but it exists for backwards compatibility.  
>The recommended migration path is to explicitly set `value` and the `onChange` handler instead of using `LinkedStateMixin`.

**Importing `LinkedStateMixin`**

```javascript
import LinkedStateMixin from 'react-addons-linked-state-mixin'; // ES6
var LinkedStateMixin = require('react-addons-linked-state-mixin'); // ES5 with npm
```

If you prefer a `<script>` tag, you can get it from `React.addons.LinkedStateMixin` with:

```html
<!-- development version -->
<script src="https://unpkg.com/react-addons-linked-state-mixin/react-addons-linked-state-mixin.js"></script>

<!-- production version -->
<script src="https://unpkg.com/react-addons-linked-state-mixin/react-addons-linked-state-mixin.min.js"></script>
```

In this case, make sure to put the `<script>` tag after React.

**Importing `LinkedInput`**

After React 16, you will also need `LinkedInput` component if you want to keep using this pattern. You can import it like this:

```javascript
import LinkedInput from 'react-linked-input'; // ES6
var LinkedInput = require('react-linked-input'); // ES5 with npm
```

If you prefer a `<script>` tag, you can get it from `LinkedInput` global with:

```html
<!-- development version -->
<script src="https://unpkg.com/react-linked-input/react-linked-input.js"></script>

<!-- production version -->
<script src="https://unpkg.com/react-linked-input/react-linked-input.min.js"></script>
```

## Overview

`LinkedStateMixin` is an easy way to express two-way binding with React.

In React, data flows one way: from owner to child. We think that this makes your app's code easier to understand. You can think of it as "one-way data binding."

However, there are lots of applications that require you to read some data and flow it back into your program. For example, when developing forms, you'll often want to update some React `state` when you receive user input. Or perhaps you want to perform layout in JavaScript and react to changes in some DOM element size.

In React, you would implement this by listening to a "change" event, read from your data source (usually the DOM) and call `setState()` on one of your components. "Closing the data flow loop" explicitly leads to more understandable and easier-to-maintain programs. See [our forms documentation](https://facebook.github.io/react/docs/forms.html) for more information.

Two-way binding -- implicitly enforcing that some value in the DOM is always consistent with some React `state` -- is concise and supports a wide variety of applications. We've provided `LinkedStateMixin`: syntactic sugar for setting up the common data flow loop pattern described above, or "linking" some data source to React `state`.

> Note:
>
> `LinkedStateMixin` is just a thin wrapper and convention around the `onChange`/`setState()` pattern. It doesn't fundamentally change how data flows in your React application.

## LinkedStateMixin: Before and After

Here's a simple form example without using `LinkedStateMixin`:

```javascript
var createReactClass = require('create-react-class');

var NoLink = createReactClass({
  getInitialState: function() {
    return {message: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({message: event.target.value});
  },
  render: function() {
    var message = this.state.message;
    return <input type="text" value={message} onChange={this.handleChange} />;
  }
});
```

This works really well and it's very clear how data is flowing, however, with a lot of form fields it could get a bit verbose. Let's use `LinkedStateMixin` to save us some typing:

```javascript
var createReactClass = require('create-react-class');
var LinkedInput = require('react-linked-input');

var WithLink = createReactClass({
  mixins: [LinkedStateMixin],
  getInitialState: function() {
    return {message: 'Hello!'};
  },
  render: function() {
    return <LinkedInput type="text" valueLink={this.linkState('message')} />;
  }
});
```

`LinkedStateMixin` adds a method to your React component called `linkState()`. `linkState()` returns a `valueLink` object which contains the current value of the React state and a callback to change it. The `LinkInput` component passes those properties to the input it renders.

`valueLink` objects can be passed up and down the tree as props, so it's easy (and explicit) to set up two-way binding between a component deep in the hierarchy and state that lives higher in the hierarchy.

Note that checkboxes have a special behavior regarding their `value` attribute, which is the value that will be sent on form submit if the checkbox is checked (defaults to `on`). The `value` attribute is not updated when the checkbox is checked or unchecked. For checkboxes, you should use `checkedLink` instead of `valueLink`:

```
<LinkedInput type="checkbox" checkedLink={this.linkState('booleanValue')} />
```
