---
id: refs-and-the-dom
title: Refs and the DOM
permalink: docs/refs-and-the-dom.html
---

In the typical React dataflow, `props` are the only way that parent components interact with their children. To modify a child, you re-render it with new `props`. However, there are a few cases where you need to imperatively modify a child outside of the typical dataflow. The child to be modified could be an instance of a React component, or it could be a DOM element. For both of these cases, React provides an escape hatch.

## The ref Callback Attribute

React supports a special attribute that you can attach to any component. The `ref` attribute takes a callback function, and the callback will be executed immediately after the component is mounted.

When the `ref` attribute is used on a HTML element, the `ref` callback receives the underlying DOM element as its argument. For example, this code uses the `ref` callback to store a reference to a DOM node:

```javascript
class CustomTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    // Explicitly focus the text input using the raw DOM API
    if (this.textInput !== null) {
      this.textInput.focus();
    }
  }

  render() {
    // Use the `ref` callback to store a reference to the text input DOM
    // element in this.textInput
    return (
      <div>
        <input type="text" ref={(input) => this.textInput = input} />
        <input
          type="button"
          value="Focus the text input"
          onClick={this.handleClick}
        />
      </div>
    );
  }
}
```

Using the `ref` callback just to set a property on the class is a common pattern for accessing DOM elements. If you are currently using `this.refs.myRefName` to access refs, we recommend using this pattern instead.

When the `ref` attribute is used on a custom component, the `ref` callback receives the mounted instance of the component as its argument. For example, if we wanted to wrap the `CustomTextInput` above to simulate it being clicked immediately after mounting:

```javascript
class AutoclickedCustomTextInput extends React.Component {
  render() {
    return <CustomTextInput ref={(input) => input.handleClick()} />;
  }
}
```

You may not use the `ref` attribute on stateless functional components, since there is no backing instance.

### Don't Overuse Refs

Your first inclination may be to use refs to "make things happen" in your app. If this is the case, take a moment and think more critically about where state should be owned in the component hierarchy. Often, it becomes clear that the proper place to "own" that state is at a higher level in the hierarchy - see the [Lifting State Up](/react/docs/lifting-state-up.html) guide for examples of this.
