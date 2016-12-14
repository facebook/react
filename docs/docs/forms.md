---
id: forms
title: Forms
permalink: docs/forms.html
prev: state-and-lifecycle.html
next: lifting-state-up.html
redirect_from:
  - "tips/controlled-input-null-value.html"
  - "docs/forms-zh-CN.html"
---

HTML form elements work a little bit differently from other DOM elements in React, because form elements naturally keep some internal state. For example, this form in plain HTML accepts a single name:

```html
<form>
  <label>
    Name:
    <input type="text" name="name" />
  </label>
  <input type="submit" value="Submit" />
</form>
```

This form has the default HTML form behavior of browsing to a new page when the user submits the form. If you want this behavior in React, it just works. But in most cases, it's convenient to have a JavaScript function that handles the submission of the form and has access to the data that the user entered into the form. The standard way to achieve this is with a technique called "controlled components".

## Controlled Components

In HTML, form elements such as `<input>`, `<textarea>`, and `<select>` typically maintain their own state and update it based on user input. In React, mutable state is typically kept in the state property of components, and only updated with [`setState()`](/react/docs/react-component.html#setstate).

We can combine the two by making the React state be the "single source of truth". Then the React component that renders a form also controls what happens in that form on subsequent user input. An input form element whose value is controlled by React in this way is called a "controlled component".

For example, if we want to make the previous example log the name when it is submitted, we can write the form as a controlled component:

```javascript{4,10-12,24}
class NameForm extends React.Component {
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
    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
```

[Try it on CodePen.](https://codepen.io/gaearon/pen/VmmPgp?editors=0010)

Since the `value` attribute is set on our form element, the displayed value will always be `this.state.value`, making the React state the source of truth. Since `handleChange` runs on every keystroke to update the React state, the displayed value will update as the user types.

With a controlled component, every state mutation will have an associated handler function. This makes it straightforward to modify or validate user input. For example, if we wanted to enforce that names are written with all uppercase letters, we could write `handleChange` as:

```javascript{2}
handleChange(event) {
  this.setState({value: event.target.value.toUpperCase()});
}
```

## The textarea Tag

In HTML, a `<textarea>` element defines its text by its children:

```html
<textarea>
  Hello there, this is some text in a text area
</textarea>
```

In React, a `<textarea>` uses a `value` attribute instead. This way, a form using a `<textarea>` can be written very similarly to a form that uses a single-line input:

```javascript{4-6,12-14,26}
class EssayForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 'Please write an essay about your favorite DOM element.'
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('An essay was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <textarea value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
```

Notice that `this.state.value` is initialized in the constructor, so that the text area starts off with some text in it.

## The select Tag

In HTML, `<select>` creates a drop-down list. For example, this HTML creates a drop-down list of flavors:

```html
<select>
  <option value="grapefruit">Grapefruit</option>
  <option value="lime">Lime</option>
  <option selected value="coconut">Coconut</option>
  <option value="mango">Mango</option>
</select>
```

Note that the Coconut option is initially selected, because of the `selected` attribute. React, instead of using this `selected` attribute, uses a `value` attribute on the root `select` tag. This is more convenient in a controlled component because you only need to update it in one place. For example:

```javascript{4,10-12,24}
class FlavorForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: 'coconut'};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Your favorite flavor is: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Pick your favorite La Croix flavor:
          <select value={this.state.value} onChange={this.handleChange}>
            <option value="grapefruit">Grapefruit</option>
            <option value="lime">Lime</option>
            <option value="coconut">Coconut</option>
            <option value="mango">Mango</option>
          </select>
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
```

[Try it on CodePen.](https://codepen.io/gaearon/pen/JbbEzX?editors=0010)

Overall, this makes it so that `<input type="text">`, `<textarea>`, and `<select>` all work very similarly - they all accept a `value` attribute that you can use to implement a controlled component.

## Multi select

In HTML, you can change a `select` tag to multiselect, with `multiple` attribute:

```html
<select multiple>
  <option value="grapefruit">Grapefruit</option>
  <option value="lime">Lime</option>
  <option value="coconut">Coconut</option>
  <option value="mango">Mango</option>
</select>
```

You can use this feature on React too:

```js{1}
<select multiple={true} value={this.state.value}>
  <option value="grapefruit">Grapefruit</option>
  <option value="lime">Lime</option>
  <option value="coconut">Coconut</option>
  <option value="mango">Mango</option>
</select>
```

Becareful, as your select tag is multiple, the value **must be an array**:

```js{3}
constructor(props) {
  super(props);
  this.state = { value: ['lime', 'mango'] };
}
```

Now we have a controlled component, so we have to set an `onChange` handler for it:

```html
<select multiple={true} value={this.state.value} onChange={this.handleChange}>
```

Writing the `onChange` handler to get current `selected` options is a bit harder
than the previous ones, we have to loop through the `options`, and get the value
of selected ones:

```js{3-8}
  handleChange(event) {
    var options = event.target.options;
    var value = [];
    for (var i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    
    this.setState({ value: value });
  }
```
[Try it on CodePen.](http://codepen.io/dashtinejad/pen/yVaojJ?editors=0010)

## Checkbox
Another form control which you can change it to a controlled component, is `checkbox`:

```html
<input type="checkbox" />
```

You can change this checkbox to controlled component by setting the `checked` property,
and consequently set the `onChange` event:

```html
<input type="checkbox" checked={this.state.value} onChange={this.handleChange} />
```

And in your JavaScript code:

```js{9}
constructor(props) {
  super(props);
  this.state = { value: true };
  
  this.handleChange = this.handleChange.bind(this);
}

handleChange(event) {
  this.setState({ value: event.target.checked });
}
```

As you can see, you can simply get the status of your checkbox, by checking the
`checked` property of the element (via `event.target`).

[Try it on CodePen.](http://codepen.io/dashtinejad/pen/YpGrEK?editors=0010)

## Radio Buttons

You can use `radio` buttons, in a replace of `select` tag. If you remember, you
group them with `name` attribute:

```html
<input type="radio" name="fruit" value="grapefruit" /> Grapefruit
<input type="radio" name="fruit" value="lime" /> Lime
<input type="radio" name="fruit" checked value="coconut" /> Coconut
<input type="radio" name="fruit" value="mango" /> Mango
```

However, in React, there is no need for `name` attribute, because 
React will take control of their state, and so, whenever one of them is checked,
the other ones will be unchecked. Like the checkbox input, you make a radio button
as a controlled component by setting the `checked` attribute of it:

```html{2-4}
<input type="radio"
  checked={this.state.value === 'grapefruit'}
  onChange={this.handleChange}
  value="grapefruit"
/> Grapefruit
```

And the `handleChange` method is the easy part:

```js{2}
handleChange(event) {
  this.setState({ value: event.target.value });
}
```
[Try it on CodePen.](http://codepen.io/dashtinejad/pen/qqaPyG?editors=0010)

## Alternatives to Controlled Components

It can sometimes be tedious to use controlled components, because you need to write an event handler for every way your data can change and pipe all of the input state through a React component. This can become particularly annoying when you are converting a preexisting codebase to React, or integrating a React application with a non-React library. In these situations, you might want to check out [uncontrolled components](/react/docs/uncontrolled-components.html), an alternative technique for implementing input forms.
