---
id: forms
title: Forms
permalink: forms.html
prev: transferring-props.html
next: working-with-the-browser.html
---

Form components such as `<input>`, `<textarea>`, and `<option>` differ from other native components because they can be mutated via user interactions. These components provide interfaces that make it easier to manage forms in response to user interactions.

For information on events on `<form>` see [Form Events](/react/docs/events.html#form-events).

## Interactive Props

Form components support a few props that are affected via user interactions:

* `value`, supported by `<input>` and `<textarea>` components.
* `checked`, supported by `<input>` components of type `checkbox` or `radio`.
* `selected`, supported by `<option>` components.

In HTML, the value of `<textarea>` is set via children. In React, you should use `value` instead.

Form components allow listening for changes by setting a callback to the `onChange` prop. The `onChange` prop works across browsers to fire in response to user interactions when:

* The `value` of `<input>` or `<textarea>` changes.
* The `checked` state of `<input>` changes.
* The `selected` state of `<option>` changes.

Like all DOM events, the `onChange` prop is supported on all native components and can be used to listen to bubbled change events.

> Note:
>
> For `<input>` and `<textarea>`, `onChange` supersedes — and should generally be used instead of — the DOM's built-in [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) event handler.

## Controlled Components

A **controlled** `<input>` has a `value` prop. Rendering a controlled `<input>` will reflect the value of the `value` prop.

```javascript
  render: function() {
    return <input type="text" value="Hello!" />;
  }
```

User input will have no effect on the rendered element because React has declared the value to be `Hello!`. To update the value in response to user input, you could use the `onChange` event:

```javascript
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    return (
      <input
        type="text"
        value={this.state.value}
        onChange={this.handleChange}
      />
    );
  }
```

In this example, we are accepting the value provided by the user and updating the `value` prop of the `<input>` component. This pattern makes it easy to implement interfaces that respond to or validate user interactions. For example:

```javascript
  handleChange: function(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

This would accept user input and truncate the value to the first 140 characters.

A **Controlled** component does not maintain its own internal state; the component renders purely based on props.

### Potential Issues With Checkboxes and Radio Buttons

Be aware that, in an attempt to normalize change handling for checkbox and radio inputs, React uses a `click` event in place of a `change` event. For the most part this behaves as expected, except when calling `preventDefault` in a `change` handler. `preventDefault` stops the browser from visually updating the input, even if `checked` gets toggled. This can be worked around either by removing the call to `preventDefault`, or putting the toggle of `checked` in a `setTimeout`.

## Uncontrolled Components

An `<input>` without a `value` property is an *uncontrolled* component:

```javascript
  render: function() {
    return <input type="text" />;
  }
```

This will render an input that starts off with an empty value. Any user input will be immediately reflected by the rendered element. If you wanted to listen to updates to the value, you could use the `onChange` event just like you can with controlled components.

An **uncontrolled** component maintains its own internal state.

### Default Value

If you want to initialize the component with a non-empty value, you can supply a `defaultValue` prop. For example:

```javascript
  render: function() {
    return <input type="text" defaultValue="Hello!" />;
  }
```

This example will function much like the **Uncontrolled Components** example above.

Likewise, `<input type="checkbox">` and `<input type="radio">` support `defaultChecked`, and `<select>` supports `defaultValue`.

> Note:
>
> The `defaultValue` and `defaultChecked` props are only used during initial render. If you need to update the value in a subsequent render, you will need to use a [controlled component](#controlled-components).

## Advanced Topics

### Why Controlled Components?

Using form components such as `<input>` in React presents a challenge that is absent when writing traditional form HTML. For example, in HTML:

```html
  <input type="text" name="title" value="Untitled" />
```

This renders an input *initialized* with the value, `Untitled`. When the user updates the input, the node's `value` *property* will change. However, `node.getAttribute('value')` will still return the value used at initialization time, `Untitled`.

Unlike HTML, React components must represent the state of the view at any point in time and not only at initialization time. For example, in React:

```javascript
  render: function() {
    return <input type="text" name="title" value="Untitled" />;
  }
```

Since this method describes the view at any point in time, the value of the text input should *always* be `Untitled`.

### Why Textarea Value?

In HTML, the value of `<textarea>` is usually set using its children:

```html
  <!-- antipattern: DO NOT DO THIS! -->
  <textarea name="description">This is the description.</textarea>
```

For HTML, this easily allows developers to supply multiline values. However, since React is JavaScript, we do not have string limitations and can use `\n` if we want newlines. In a world where we have `value` and `defaultValue`, it is ambiguous what role children play. For this reason, you should not use children when setting `<textarea>` values:

```javascript
  <textarea name="description" value="This is a description." />
```

If you *do* decide to use children, they will behave like `defaultValue`.

### Why Select Value?

The selected `<option>` in an HTML `<select>` is normally specified through that option's `selected` attribute. In React, in order to make components easier to manipulate, the following format is adopted instead:

```javascript
  <select value="B">
    <option value="A">Apple</option>
    <option value="B">Banana</option>
    <option value="C">Cranberry</option>
  </select>
```

To make an uncontrolled component, `defaultValue` is used instead.

> Note:
>
> You can pass an array into the `value` attribute, allowing you to select multiple options in a `select` tag: `<select multiple={true} value={['B', 'C']}>`.
