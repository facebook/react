---
id: shallow-compare
title: Shallow Compare
permalink: docs/shallow-compare.html
layout: docs
category: Reference
---

> Note:
>
> `shallowCompare` is a legacy add-on. Use [`React.PureComponent`](/docs/react-api.html#react.purecomponent) instead.

**Importing**

```javascript
import shallowCompare from 'react-addons-shallow-compare'; // ES6
var shallowCompare = require('react-addons-shallow-compare'); // ES5 with npm
```

## Overview

Before [`React.PureComponent`](/docs/react-api.html#react.purecomponent) was introduced, `shallowCompare` was commonly used to achieve the same functionality as [`PureRenderMixin`](pure-render-mixin.html) while using ES6 classes with React.

If your React component's render function is "pure" (in other words, it renders the same result given the same props and state), you can use this helper function for a performance boost in some cases.

Example:

```js
export class SampleComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  render() {
    return <div className={this.props.className}>foo</div>;
  }
}
```

`shallowCompare` performs a shallow equality check on the current `props` and `nextProps` objects as well as the current `state` and `nextState` objects.  
It does this by iterating on the keys of the objects being compared and returning true when the values of a key in each object are not strictly equal.

`shallowCompare` returns `true` if the shallow comparison for props or state fails and therefore the component should update.  
`shallowCompare` returns `false` if the shallow comparison for props and state both pass and therefore the component does not need to update.
