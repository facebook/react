---
id: children-undefined
title: this.props.children undefined
layout: tips
permalink: tips/children-undefined.html
prev: expose-component-functions.html
next: use-react-with-other-libraries.html
---

You can't access the children of your component through `this.props.children`. `this.props.children` designates the children being **passed onto you** by the owner:

```js
var App = React.createClass({
  componentDidMount: function() {
    // This doesn't refer to the `span`s! It refers to the children between
    // last line's `<App></App>`, which are undefined.
    console.log(this.props.children);
  },

  render: function() {
    return <div><span/><span/></div>;
  }
});

ReactDOM.render(<App></App>, mountNode);
```

To access your own subcomponents (the `span`s), place [refs](/react/docs/more-about-refs.html) on them.
