---
id: forms
title: Forms
permalink: docs/forms.html
prev: state-and-lifecycle.html
next: lifting-state-up.html
redirect_from: "tips/controlled-input-null-value.html"
---

Form components such as `<input>`, `<textarea>`, and `<option>` differ from other native components because they can be mutated via user interactions. These components provide interfaces that make it easier to manage forms in response to user interactions.

Two types of form components:

* Controlled Components
* Uncontrolled Components

You can jump directly to <a href="/react/docs/forms.html#examples">examples</a>.

## Controlled Components

A **controlled** form component provides a `value` prop. A **controlled** component does not maintain its own internal state; the component renders purely based on props.

```javascript
render() {
  return <input type="text" value="Hello!" />;
}
```

User input has no effect on the rendered element because React has declared the value to be "Hello!".

To update the value in response to user input, you would use the `onChange` event to save the new value, then pass that to the `value` prop of the form:

```javascript{10,22,23}
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Text field value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <input type="text"
          placeholder="Hello!"
          value={this.state.value}
          onChange={this.handleChange} />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try it on CodePen.](https://codepen.io/ericnakagawa/pen/QKkJva?editors=0010)

In this example, we are accepting the value provided by the user and updating the `value` prop of the `<input>` component. This pattern makes it easy to implement interfaces that respond to or validate user interactions. For example:

```javascript
  handleChange(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

This would accept user input and truncate the value to the first 140 characters.

### Potential Issues With Checkboxes and Radio Buttons

Be aware that, in an attempt to normalize change handling for checkbox and radio inputs, React uses a `click` event in place of a `change` event. For the most part this behaves as expected, except when calling `preventDefault` in a `change` handler. `preventDefault` stops the browser from visually updating the input, even if `checked` gets toggled. This can be worked around either by removing the call to `preventDefault`, or putting the toggle of `checked` in a `setTimeout`.

## Uncontrolled Components

Form components that do not provide a `value` prop are *uncontrolled*.

The example below renders an `<input>` control with an empty value. Any user input will be immediately reflected by the rendered element.

An **uncontrolled** component manages its own state.

```javascript
  render() {
    return <input type="text" />;
  }
```

If you wanted to listen to updates to the value, you could use the `onChange` event just like you can with controlled components. However, you would _not_ pass the value you saved to the component.

```javascript{10,22}
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Text field value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <input type="text"
          placeholder="Hello!"
          onChange={this.handleChange} />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try it on CodePen.](https://codepen.io/ericnakagawa/pen/XjxyoL?editors=0010)

###Default Values

To initialize an uncontrolled component with a non-empty value, you can supply a `defaultValue` prop.

```javascript
  render() {
    return <input type="text" defaultValue="Hello!" />;
  }
```

Likewise, `<input type="checkbox">` and `<input type="radio">` support `defaultChecked`, and `<select>` supports `defaultValue`.

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
> For `<input>` and `<textarea>`, `onChange` should generally be used instead of the DOM's built-in [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) event handler.

## Advanced Topics

### Why Controlled Components?

Using form components such as `<input>` in React presents a challenge that is absent when writing traditional form HTML. For example, in HTML:

```html
  <input type="text" name="title" value="Untitled" />
```

This renders an input *initialized* with the value, `Untitled`. When the user updates the input, the node's `value` *property* will change. However, `node.getAttribute('value')` will still return the value used at initialization time, `Untitled`.

Unlike HTML, React components must represent the state of the view at any point in time and not only at initialization time. For example, in React:

```javascript
  render() {
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

The selected `<option>` in an HTML `<select>` is normally specified through that option's `selected` attribute. In React we assign the `select` component a specific value by passing a `value` prop:

```javascript{1}
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

### Imperative operations

If you need to imperatively perform an operation, you have to obtain a [reference to the DOM node](/react/docs/more-about-refs.html#the-ref-callback-attribute).
For instance, if you want to imperatively submit a form, one approach would be to attach a `ref` to the `form` element and manually call `form.submit()`.

## Examples

### Basic Controlled Input

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Text field value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="edit me"
          value={this.state.value}
          onChange={this.handleChange}
        />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try this on CodePen.](https://codepen.io/ericnakagawa/pen/JRmZjz?editors=0010)


### Basic Controlled Textarea

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Textarea value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <textarea
          name="description"
          value={this.state.value}
          onChange={this.handleChange}
        />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try this on CodePen.](https://codepen.io/ericnakagawa/pen/kkAQPp?editors=0010)

### Basic Uncontrolled Select

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: 'B'};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Select value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <select value={this.state.value} onChange={this.handleChange}>
          <option value="A">Apple</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try this on CodePen.](https://codepen.io/ericnakagawa/pen/pExQbL?editors=0010)

### Basic Radio Button

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: 'B'};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Radio button value is: ' + this.state.value);
  }

  render() {
    return (
      <div>
        <label>
          <input type="radio" value="A" id="choice-a"
            onChange={this.handleChange} />
          Option A
        </label>
        <br />
        <label>
          <input type="radio" value="B" id="choice-b"
            onChange={this.handleChange} defaultChecked={true} />
          Option B
        </label>
        <br />
        <label>
          <input type="radio" value="C" id="choice-c"
          onChange={this.handleChange} /> 
          Option C
        </label>
        <br /><br />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try this on CodePen.](https://codepen.io/ericnakagawa/pen/WGaYVg?editors=0010)


### Basic Uncontrolled Checkbox

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {checked: {'A': false, 'B': true, 'C': false}};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    let value = event.target.value;
    let checked = this.state.checked; // copy 
    if (!checked[value]) { checked[value] = true; } else { checked[value] = false; }
    this.setState({checked: checked})
  }

  handleSubmit(event) {
    alert('Boxes checked: ' +
      (this.state.checked.A ? 'A ' : '') +
      (this.state.checked.B ? 'B ' : '') +
      (this.state.checked.C ? 'C' : '')
    );
  }

  render() {
    return (
      <div>
        <label>
          <input type="checkbox" value="A"
            onChange={this.handleChange} /> 
          Option A
        </label>
        <br />
        <label>
          <input type="checkbox" value="B"
          onChange={this.handleChange} defaultChecked={true} /> 
          Option B
        </label>
        <br />
        <label><input type="checkbox" value="C"
          onChange={this.handleChange} /> 
          Option C
        </label>
        <br /><br />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}
ReactDOM.render(<Form />, document.getElementById('root'));
```

[Try it on CodePen.](https://codepen.io/ericnakagawa/pen/kkAzPO?editors=0010)

### Form Events

Event names:

```
onChange onInput onSubmit
```
