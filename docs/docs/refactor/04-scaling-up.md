# Scaling Up: Using Multiple Components

So far, we've looked at how to write a single component to display data and handle user input. Next let's examine one of React's finest features: composability.

## Motivation: separation of concerns

By building modular components that reuse other components using well-definted interfaces, you get much of the same benefits that you get by using functions or classes. Specifically you can *separate the different concerns* of your app however you please simply by building new components. By building a custom component library for your application, you are expressing your UI in a way that best fits your domain.

## Composition example

```javascript
/** @jsx React.DOM */


```