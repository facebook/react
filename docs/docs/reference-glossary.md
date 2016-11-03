---

id: glossary
title: A Glossary of Terms in React
permalink: docs/glossary.html

---

#A Glossary of Terms in React

## JSX

JSX is a syntax extension to JavaScript. It is similar to a template language. When JSX gets compiled, the result is JavaScript objects called "elements"

## Elements
React elements are the building blocks of React applications. An element describes what you want to see on the screen. React elements are immutable.

```js
const element = <h1>Hello, world</h1>;
```

## Components
React components are small, resuable pieces of code that return a React element to be rendered to the page. The simplest version of React component is a plain JavaScript function that returns a React element. Components can be broken down into distinct pieces of functionality and used within other components. Components must return a single root element (wrapped in a `div` or other similar container). Component names should also always start with a capital letter (`<Wrapper/>` **not** `<wrapper/>`)


### `props`
`props` are inputs to a React component. They are data passed down from a parent component to a child component. `props` are readonly -- they should not be modified in any way.

### `this.props.children`
`this.props.children` is available on every component. It contains the content between the opening and closing tags of a component. For example:

```js
<Welcome>Hello world!</Welcome>
```
The string `Hello world!` is available in `this.props.children` in the `Welcome` component.

### `state`
A component's `state` is a snapshot of the data contained in a component. `props` and `state` are different: `state` is user-defined, `props` are received from a parent component.

## Lifecycle Methods
Lifecycle methods are custom functionality that gets executed during the different phases of a component. There are methods available when the component gets created and inserted into the DOM ([mounting](https://facebook.github.io/react/docs/react-component.html#mounting)), when the component updates and when the component gets unmounted or removed from the DOM. 

## Keys 
 A "key" is a special string attribute you need to include when creating lists of elements. Keys help React identify which items have changed, are added, or are removed. Keys should be given to the elements inside the array to give the elements a stable identity.