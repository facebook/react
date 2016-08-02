---
title: Invalid type for createElement
layout: single
permalink: warnings/create-element-types.html
---

You probably came to this page because of this error:

```
Warning: React.createElement: type should not be null, undefined, boolean, or number.
It should be a string (for DOM elements) or a ReactClass (for composite components).
```

This usually occurs when attempting to render an element that is of an invalid type. The following examples will trigger this error:

### Invalid types

Ensure that your component is not of the following types: undefined, boolean, number or null.

`Foo.js`

```js
let Foo;

if (false) {
  Foo = <div />
}

export default Foo; // Foo is undefined
```

`App.js`

```js
import Foo from './Foo'

class ReactApp extends Component {
  render() {
    return <Foo />;
  }
}
```

### Invalid member imports

This happens when attempting to import a member as a default member, or importing a default member as a member.

`Foo.js`

```js
export const Foo = () => { return <div /> }
```

`App.js`

```js
import Foo from './Foo' // wrong!
// correct: import { Foo } from './Foo';

class ReactApp extends Component {
  render() {
    return <Foo />;
  }
}
```

### Invalid or missing export

Check that the component is exported properly with the keyword `export`.

`Foo.js`

```js
const Foo = () => { return <div /> } // Foo needs to be exported
```

`App.js`

```js
import { Foo } from './Foo' // Foo is undefined

class ReactApp extends Component {
  render() {
    return <Foo />;
  }
}
```
