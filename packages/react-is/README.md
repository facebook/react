# `react-is`

This package allows you to test arbitrary values and see if they're a particular React type, e.g. React Elements.

## Usage

```js
import React from 'react';
import {isElement} from 'react-is';
isElement(<div />); // true
```

```js
import React from 'react';
import {isFragment} from 'react-is';
isFragment(<></>); // true
```

```js
import React from 'react';
import {createPortal} from 'react-dom';
import {isPortal} from 'react-is';
isPortal(createPortal(<div />, document.body)); // true
```

```js
import React from 'react';
import {createPortal} from 'react-dom';
import {typeOf} from 'react-is';
typeOf(<div />); // "ReactElement"
typeOf(<></>); // "ReactFragment"
typeOf(createPortal(<div />, document.body)); // "ReactPortal"
```
