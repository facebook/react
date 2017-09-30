---
title: Unknown Prop Warning
layout: single
permalink: warnings/unknown-prop.html
---
The unknown-prop warning will fire if you attempt to render a DOM element with a prop that is not recognized by React as a legal DOM attribute/property. You should ensure that your DOM elements do not have spurious props floating around.

There are a couple of likely reasons this warning could be appearing:

1. Are you using `{...this.props}` or `cloneElement(element, this.props)`? Your component is transferring its own props directly to a child element (eg. https://reactjs.org/docs/transferring-props.html). When transferring props to a child component, you should ensure that you are not accidentally forwarding props that were intended to be interpreted by the parent component.

2. You are using a non-standard DOM attribute on a native DOM node, perhaps to represent custom data. If you are trying to attach custom data to a standard DOM element, consider using a custom data attribute as described [on MDN](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes).

3. React does not yet recognize the attribute you specified. This will likely be fixed in a future version of React. However, React currently strips all unknown attributes, so specifying them in your React app will not cause them to be rendered.

4. You are using a React component without an upper case. React interprets it as a DOM tag because [React JSX transform uses the upper vs. lower case convention to distinguish between user-defined components and DOM tags](/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized).

---

To fix this, composite components should "consume" any prop that is intended for the composite component and not intended for the child component. Example:

**Bad:** Unexpected `layout` prop is forwarded to the `div` tag.

```js
function MyDiv(props) {
  if (props.layout === 'horizontal') {
    // BAD! Because you know for sure "layout" is not a prop that <div> understands.
    return <div {...props} style={getHorizontalStyle()} />
  } else {
    // BAD! Because you know for sure "layout" is not a prop that <div> understands.
    return <div {...props} style={getVerticalStyle()} />
  }
}
```

**Good:** The spread operator can be used to pull variables off props, and put the remaining props into a variable.

```js
function MyDiv(props) {
  const { layout, ...rest } = props
  if (layout === 'horizontal') {
    return <div {...rest} style={getHorizontalStyle()} />
  } else {
    return <div {...rest} style={getVerticalStyle()} />
  }
}
```

**Good:** You can also assign the props to a new object and delete the keys that you're using from the new object. Be sure not to delete the props from the original `this.props` object, since that object should be considered immutable.

```js
function MyDiv(props) {

  const divProps = Object.assign({}, props);
  delete divProps.layout;

  if (props.layout === 'horizontal') {
    return <div {...divProps} style={getHorizontalStyle()} />
  } else {
    return <div {...divProps} style={getVerticalStyle()} />
  }
}
```
