# `react-is`

This package allows you to test arbitrary values and see if they're a particular React type, e.g. React Elements.

## Installation

```sh
# Yarn
yarn add react-is

# NPM
npm install react-is --save
```

## Usage

### AsyncMode

```js
import React from "react";
import * as ReactIs from 'react-is';

ReactIs.isAsyncMode(<React.unstable_AsyncMode />); // true
ReactIs.typeOf(<React.unstable_AsyncMode />) === ReactIs.AsyncMode; // true
```

### Context

```js
import React from "react";
import * as ReactIs from 'react-is';

const ThemeContext = React.createContext("blue");

ReactIs.isContextConsumer(<ThemeContext.Consumer />); // true
ReactIs.isContextProvider(<ThemeContext.Provider />); // true
ReactIs.typeOf(<ThemeContext.Provider />) === ReactIs.ContextProvider; // true
ReactIs.typeOf(<ThemeContext.Consumer />) === ReactIs.ContextConsumer; // true
```

### Element

```js
import React from "react";
import * as ReactIs from 'react-is';

ReactIs.isElement(<div />); // true
ReactIs.typeOf(<div />) === ReactIs.Element; // true
```

### Fragment

```js
import React from "react";
import * as ReactIs from 'react-is';

ReactIs.isFragment(<></>); // true
ReactIs.typeOf(<></>) === ReactIs.Fragment; // true
```

### Portal

```js
import React from "react";
import ReactDOM from "react-dom";
import * as ReactIs from 'react-is';

const div = document.createElement("div");
const portal = ReactDOM.createPortal(<div />, div);

ReactIs.isPortal(portal); // true
ReactIs.typeOf(portal) === ReactIs.Portal; // true
```

### StrictMode

```js
import React from "react";
import * as ReactIs from 'react-is';

ReactIs.isStrictMode(<React.StrictMode />); // true
ReactIs.typeOf(<React.StrictMode />) === ReactIs.StrictMode; // true
```
