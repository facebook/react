---
id: faq-styling
title: Styling and CSS
permalink: docs/faq-styling.html
layout: docs
category: FAQ
---

### How do I add CSS classes to components?

Pass a string as the `className` prop:

```jsx
render() {
  return <span className="menu navigation-menu">Menu</span>
}
```

### Can I use inline styles?

Yes, see https://reactjs.org/docs/dom-elements.html#style

### Are inline styles bad?

CSS classes are generally more efficient than inline styles.

### What is CSS-in-JS?

CSS-in-JS refers to a pattern where CSS is written with Javascript, then extracted into a stylesheet.

[Comparison of CSS-in-JS Libraries](https://github.com/MicheleBertoli/css-in-js)

### Can I do animations in React?

React can be used to power animations. See [React Transition Group](https://reactcommunity.org/react-transition-group/), for example.
