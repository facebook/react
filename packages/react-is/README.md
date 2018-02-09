# `react-is`

This package allows you to test arbitrary values and see if they're a particular React type, e.g. React Elements.

## Usage

### AsyncMode
```js
import React from 'react';
import {isAsyncMode, typeOf} from 'react-is';

const AsyncMode = React.unstable_AsyncMode;

typeOf(<AsyncMode />); // "ReactAsyncMode"

isAsyncMode(<AsyncMode />); // true
```

### Context
```js
import React from 'react';
import {isContextConsumer, isContextProvider, typeOf} from 'react-is';

const ThemeContext = React.createContext('blue');

typeOf(<ThemeContext.Provider />); // "ReactContextProvider"
typeOf(<ThemeContext.Consumer />); // "ReactContextConsumer"

isContextConsumer(<ThemeContext.Consumer />); // true
isContextProvider(<ThemeContext.Provider />); // true
```

### Element
```js
import React from 'react';
import {isElement, typeOf} from 'react-is';

typeOf(<div />); // "ReactElement"

isElement(<div />); // true
```

### Fragment
```js
import React from 'react';
import {isFragment, typeOf} from 'react-is';

typeOf(<></>); // "ReactFragment"

isFragment(<></>); // true
```

### Portal
```js
import React from 'react';
import {createPortal} from 'react-dom';
import {isPortal, typeOf} from 'react-is';

const div = document.createElement('div');
const portal = createPortal(<div />, div);

typeOf(portal); // "ReactPortal"

isPortal(portal); // true
```

### StrictMode
```js
import React from 'react';
import {isStrictMode, typeOf} from 'react-is';

typeOf(<React.StrictMode />); // "ReactStrictMode"

isStrictMode(<React.StrictMode />); // true
```