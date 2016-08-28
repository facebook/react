---
title: Invalid type for createElement
layout: single
permalink: warnings/create-element-types.html
---

You probably came here because your code is trying to create a ReactElement with an invalid type using JSX or the `React.createElement` API. This usually happens when you have an invalid import statement.

`React.createElement` requires an argument of type `string` (e.g. 'div', 'span'), or a `ReactClass`/`React.Component`. It cannot be of type `number`, `boolean`, `undefined` or `null`. See the documentation of this API: [https://facebook.github.io/react/docs/top-level-api.html](https://facebook.github.io/react/docs/top-level-api.html)

The following common examples will trigger this error:

### Invalid types

Ensure that your component is not of the following types: undefined, boolean, number or null.

`Components.js`

```js
let Foo, Bar;

if (false) {
  Foo = () => <div />;
}

Bar = React.createElement(42);
// The following types are invalid, too.
// Bar = 42;
// Bar = null;
// Bar = undefined;
// Bar = true;

export { Foo, Bar }; // Foo is undefined and Bar is an invalid element.
```

`App.js`

```js
import { Foo, Bar } from './Components'

class ReactApp extends Component {
  render() {
    return <Foo />; // or return <Bar />
  }
}
```

### Invalid member imports

This happens when attempting to import a member as a default member, or importing a default member as a member.

`Components.js`

```js
export const Foo = () => { return <div /> }
```

`App.js`

```js
import Foo from './Components' // wrong!
// correct: import { Foo } from './Components';

class ReactApp extends Component {
  render() {
    return <Foo />;
  }
}
```

### Invalid or missing export

Check that the component is exported properly with the keyword `export`.

`Components.js`

```js
const Foo = () => { return <div /> } // Foo needs to be exported
```

`App.js`

```js
import { Foo } from './Components' // Foo is undefined

class ReactApp extends Component {
  render() {
    return <Foo />;
  }
}
```
